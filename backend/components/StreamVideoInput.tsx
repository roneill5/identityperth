import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Button, Card, Dialog, Flex, Inline, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {UploadIcon} from '@sanity/icons/Upload'
import {set, unset, useClient, type StringInputProps} from 'sanity'

/**
 * The input for a Cloudflare Stream video ID (Ross, 3 Nov): upload a file from
 * here, pick one the account already holds, or paste an ID. The file goes from
 * this browser straight to Stream's one-time upload URL; the site's Worker
 * only mints that URL, lists videos and reports processing, and it checks the
 * editor's Studio session before doing any of it (web/src/lib/stream-admin.ts).
 * The ID is saved the moment the upload lands; the video plays once Stream
 * has processed it, which this input watches. Nothing here deletes anything:
 * the Stream account also holds other sites' videos.
 */
const STREAM_HOST = 'https://customer-16n3ytiw02tgly9e.cloudflarestream.com'
const MAX_BYTES = 200 * 1024 * 1024 // Stream's basic direct upload; larger files need the tus protocol
const UID = /^[a-f0-9]{32}$/i
const POLL_MS = 4000

type Video = {
  uid: string
  name: string
  duration: number | null
  created: string | null
  ready: boolean
  state: string | null
  error: string | null
  width: number | null
  height: number | null
}

const apiBase = () =>
  typeof location !== 'undefined' && location.port === '3333' ? 'http://localhost:4321/backend/api/stream' : '/backend/api/stream'
const poster = (uid: string, width = 640) => `${STREAM_HOST}/${uid}/thumbnails/thumbnail.jpg?time=0s&width=${width}`
const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')
const seconds = (s: number | null) => (s == null ? '' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`)
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-AU', {day: 'numeric', month: 'short', year: 'numeric'}) : '')

/** The editor's Studio session token, which the Worker checks against the project. */
function useStudioToken() {
  const client = useClient({apiVersion: '2025-01-01'})
  return useCallback(() => {
    const {token, projectId} = client.config()
    if (token) return token
    try {
      const stored = localStorage.getItem(`__studio_auth_token_${projectId}`)
      if (!stored) return ''
      const parsed = JSON.parse(stored) as unknown
      return typeof parsed === 'string' ? parsed : ((parsed as {token?: string})?.token ?? '')
    } catch {
      return ''
    }
  }, [client])
}

async function api<T>(getToken: () => string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {...init, headers: {...(init.headers ?? {}), Authorization: `Bearer ${getToken()}`}})
  const data = (await res.json().catch(() => ({}))) as T & {error?: string}
  if (!res.ok) throw new Error(data.error || `The video service answered ${res.status}`)
  return data
}

export function StreamVideoInput(props: StringInputProps) {
  const {value, onChange, readOnly} = props
  const getToken = useStudioToken()
  const uid = value && UID.test(value) ? value : null
  const [video, setVideo] = useState<Video | null>(null)
  const [busy, setBusy] = useState<'idle' | 'uploading'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [library, setLibrary] = useState(false)
  const [pasted, setPasted] = useState('')
  const needsFile = useRef(false) // a fresh upload: ask Stream for the MP4 once it is ready
  const xhr = useRef<XMLHttpRequest | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  // The saved video's state, watched while Stream processes it.
  useEffect(() => {
    if (!uid) {
      setVideo(null)
      return
    }
    let stopped = false
    let timer = 0
    const look = async () => {
      try {
        let v = await api<Video>(getToken, `/videos/${uid}`)
        if (stopped) return
        if (v.ready && needsFile.current) {
          needsFile.current = false
          v = await api<Video>(getToken, `/videos/${uid}`, {method: 'POST'})
        }
        setVideo(v)
        if (!v.ready && !v.error) timer = window.setTimeout(look, POLL_MS)
      } catch (e) {
        if (!stopped) setError(message(e))
      }
    }
    void look()
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [uid, getToken])

  const upload = async (file: File) => {
    setError(null)
    if (!file.type.startsWith('video/')) return setError('Choose a video file (MP4 is best).')
    if (file.size > MAX_BYTES) return setError(`That file is ${Math.round(file.size / 1048576)} MB. Uploads from here go up to 200 MB; ask Ross to put larger ones on Stream.`)
    setBusy('uploading')
    setProgress(0)
    try {
      const {uploadURL, uid: next} = await api<{uploadURL: string; uid: string}>(getToken, '/upload-url', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: file.name.replace(/\.[^.]+$/, '')}),
      })
      await new Promise<void>((resolve, reject) => {
        const req = new XMLHttpRequest()
        xhr.current = req
        req.open('POST', uploadURL)
        req.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100))
        req.onload = () => (req.status >= 200 && req.status < 300 ? resolve() : reject(new Error(`Stream refused the upload (${req.status}).`)))
        req.onerror = () => reject(new Error('The upload failed. Check the connection and try again.'))
        req.onabort = () => reject(new Error('Upload cancelled.'))
        const form = new FormData()
        form.append('file', file)
        req.send(form)
      })
      needsFile.current = true
      onChange(set(next))
    } catch (e) {
      setError(message(e))
    } finally {
      xhr.current = null
      setBusy('idle')
    }
  }

  const pick = () => fileInput.current?.click()
  const disabled = Boolean(readOnly) || busy !== 'idle'
  const status = !video
    ? 'Checking with Stream…'
    : video.error
      ? `Stream could not process this video: ${video.error}`
      : video.ready
        ? [video.width && video.height ? `${video.width} × ${video.height}` : '', seconds(video.duration), day(video.created)].filter(Boolean).join(' · ')
        : 'Stream is processing the video. It plays on the site once this finishes.'

  return (
    <Stack gap={3}>
      {uid ? (
        <Card border radius={2} overflow="hidden">
          <Flex>
            <Box style={{width: 200, flex: 'none', aspectRatio: '16 / 9', background: '#1e1d1e'}}>
              {video?.ready ? (
                <img src={poster(uid)} alt="" style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <Flex align="center" justify="center" style={{height: '100%'}}>
                  {video?.error ? null : <Spinner muted />}
                </Flex>
              )}
            </Box>
            <Stack padding={3} gap={3} flex={1}>
              <Text size={1} weight="medium">
                {video?.name || 'Video'}
              </Text>
              <Text size={1} muted>
                {status}
              </Text>
              <Text size={0} muted style={{fontFamily: 'monospace'}}>
                {uid}
              </Text>
              <Inline gap={2}>
                <Button icon={UploadIcon} text="Replace" mode="ghost" fontSize={1} padding={2} onClick={pick} disabled={disabled} />
                <Button icon={SearchIcon} text="Choose from library" mode="ghost" fontSize={1} padding={2} onClick={() => setLibrary(true)} disabled={disabled} />
                <Button icon={TrashIcon} text="Remove" mode="ghost" tone="critical" fontSize={1} padding={2} onClick={() => onChange(unset())} disabled={disabled} />
              </Inline>
            </Stack>
          </Flex>
        </Card>
      ) : (
        <Card border radius={2} padding={4}>
          <Stack gap={4}>
            <Inline gap={2}>
              <Button icon={UploadIcon} text="Upload a video" tone="primary" onClick={pick} disabled={disabled} />
              <Button icon={SearchIcon} text="Choose from library" mode="ghost" onClick={() => setLibrary(true)} disabled={disabled} />
            </Inline>
            <Text size={1} muted>
              MP4, up to 200 MB. It plays silently on a loop and its first frame is the poster, so start on a frame worth showing.
            </Text>
            <Flex gap={2} align="center">
              <Box flex={1}>
                <TextInput
                  fontSize={1}
                  padding={2}
                  placeholder="Or paste a Stream video ID"
                  value={pasted}
                  onChange={(e) => setPasted(e.currentTarget.value.trim())}
                  disabled={disabled}
                />
              </Box>
              <Button text="Use" mode="ghost" fontSize={1} padding={2} disabled={disabled || !UID.test(pasted)} onClick={() => (onChange(set(pasted)), setPasted(''))} />
            </Flex>
          </Stack>
        </Card>
      )}

      {busy === 'uploading' && (
        <Card border radius={2} padding={3}>
          <Stack gap={3}>
            <Flex justify="space-between" align="center">
              <Text size={1}>Uploading… {progress}%</Text>
              <Button text="Cancel" mode="bleed" fontSize={1} padding={2} onClick={() => xhr.current?.abort()} />
            </Flex>
            <div style={{height: 4, borderRadius: 2, background: 'var(--card-border-color)'}}>
              <div style={{height: '100%', width: `${progress}%`, borderRadius: 2, background: 'var(--card-focus-ring-color)', transition: 'width 0.2s'}} />
            </div>
          </Stack>
        </Card>
      )}

      {error && (
        <Card tone="critical" border radius={2} padding={3}>
          <Text size={1}>{error}</Text>
        </Card>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        style={{display: 'none'}}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          e.currentTarget.value = ''
          if (file) void upload(file)
        }}
      />

      {library && (
        <Library
          getToken={getToken}
          onClose={() => setLibrary(false)}
          onPick={(v) => {
            setLibrary(false)
            setError(null)
            onChange(set(v.uid))
          }}
        />
      )}
    </Stack>
  )
}

/** The account's videos, newest first, searchable by name. */
function Library({getToken, onClose, onPick}: {getToken: () => string; onClose: () => void; onPick: (v: Video) => void}) {
  const [search, setSearch] = useState('')
  const [videos, setVideos] = useState<Video[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stopped = false
    const timer = window.setTimeout(async () => {
      try {
        const {videos: list} = await api<{videos: Video[]}>(getToken, `/videos?search=${encodeURIComponent(search)}`)
        if (!stopped) setVideos(list)
      } catch (e) {
        if (!stopped) setError(message(e))
      }
    }, search ? 300 : 0)
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [search, getToken])

  return (
    <Dialog id="stream-library" header="Choose a video" width={2} onClose={onClose} zOffset={1000}>
      <Stack padding={4} gap={4}>
        <TextInput icon={SearchIcon} placeholder="Search by name" value={search} onChange={(e) => setSearch(e.currentTarget.value)} autoFocus />
        {error ? (
          <Card tone="critical" border radius={2} padding={3}>
            <Text size={1}>{error}</Text>
          </Card>
        ) : !videos ? (
          <Flex justify="center" padding={5}>
            <Spinner muted />
          </Flex>
        ) : videos.length === 0 ? (
          <Text size={1} muted>
            No videos match.
          </Text>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12}}>
            {videos.map((v) => (
              <Card key={v.uid} as="button" border radius={2} overflow="hidden" onClick={() => onPick(v)} disabled={!v.ready} style={{textAlign: 'left', padding: 0, cursor: v.ready ? 'pointer' : 'default'}}>
                <Box style={{aspectRatio: '16 / 9', background: '#1e1d1e'}}>
                  {v.ready && <img src={poster(v.uid, 320)} alt="" loading="lazy" style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}} />}
                </Box>
                <Stack padding={2} gap={2}>
                  <Text size={1} weight="medium" textOverflow="ellipsis">
                    {v.name || v.uid}
                  </Text>
                  <Text size={0} muted>
                    {v.ready ? [seconds(v.duration), day(v.created)].filter(Boolean).join(' · ') : 'Still processing'}
                  </Text>
                </Stack>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </Dialog>
  )
}
