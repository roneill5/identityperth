// Loads a legal document (Terms & Conditions, a privacy policy) into the CMS as
// a `legalPage`, keeping the Word document's structure as rich text: lines in
// capitals become group headings, "1. Title" lines numbered-clause subheadings,
// "1.1 Title" lines minor headings, "(a) ...; (b) ..." runs a list with the
// letters kept in the text, and defined terms ("Client means ...") go bold.
// Re-running replaces the page's text; the Studio keeps everything else.
//
// Run from backend/ (a .docx needs macOS, for textutil):
//   npx sanity exec scripts/import-legal.mjs --with-user-token -- "<file.docx or .txt>" --slug terms --title "Terms & Conditions" [--dry]
import {getCliClient} from 'sanity/cli'
import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const file = args.find((a) => /\.(docx|txt)$/i.test(a))
const slug = flag('--slug')
const title = flag('--title')
const dry = args.includes('--dry')
if (!file || !slug || !title) {
  throw new Error('Usage: import-legal.mjs <file.docx or file.txt> --slug <slug> --title "<title>" [--dry]')
}

const text = /\.docx$/i.test(file)
  ? execFileSync('textutil', ['-convert', 'txt', '-stdout', file], {encoding: 'utf8'})
  : readFileSync(file, 'utf8')

const key = () => Math.random().toString(36).slice(2, 14)
const span = (text, marks = []) => ({_type: 'span', _key: key(), text, marks})
const block = (style, children, extra = {}) => ({_type: 'block', _key: key(), style, markDefs: [], children, ...extra})
const isCaps = (line) => /[A-Z]/.test(line) && !/[a-z]/.test(line)

// Headings arrive in capitals; the site sets them in a serif, so sentence-case
// them and put back the names and initialisms that need their capitals.
const KEEP = ['AI', 'GST', 'ASIC', 'IP', 'WCAG', 'SEO', 'CMS', 'CRM', 'FTP', 'SSL', 'DNS', 'API', 'RGB', 'CMYK', 'Australian Consumer Law', 'Western Australia', 'Identity']
const sentenceCase = (s) => {
  let out = s.toLowerCase()
  out = out.charAt(0).toUpperCase() + out.slice(1)
  for (const word of KEEP) {
    out = out.replace(new RegExp(`(^|[^a-z])${word.toLowerCase()}(?=$|[^a-z])`, 'g'), (m, before) => before + word)
  }
  return out
}

const lines = text.split(/\r?\n/).map((l) => l.trim())
// The title block (company name, document title) is the run of capitalised lines at the top.
let i = 0
while (i < lines.length && (lines[i] === '' || isCaps(lines[i]))) i++

const body = []
let inDefinitions = false
for (; i < lines.length; i++) {
  const line = lines[i]
  if (!line) continue
  let m
  if ((m = line.match(/^(\d+)\.\s+(.+)$/)) && isCaps(m[2])) {
    // A clause that arrives before any group heading (the opening Definitions
    // clause does) gets a group of its own, titled after itself, so every
    // clause on the page sits under a numbered section.
    if (!body.some((b) => b.style === 'h2')) body.push(block('h2', [span(sentenceCase(m[2]))]))
    body.push(block('h3', [span(`${m[1]}. ${sentenceCase(m[2])}`)]))
    inDefinitions = false
  } else if ((m = line.match(/^(\d+\.\d+)\s+(.+)$/))) {
    body.push(block('h4', [span(line)]))
    inDefinitions = /definitions/i.test(m[2])
  } else if (isCaps(line)) {
    body.push(block('h2', [span(sentenceCase(line))]))
    inDefinitions = false
  } else if (/^\(a\)\s/.test(line)) {
    for (const item of line.split(/\s*(?=\([a-z]\)\s)/).filter(Boolean)) {
      body.push(block('normal', [span(item)], {listItem: 'bullet', level: 1}))
    }
  } else if (inDefinitions && (m = line.match(/^(.{1,40}?) (means|includes) /))) {
    body.push(block('normal', [span(m[1], ['strong']), span(line.slice(m[1].length))]))
  } else {
    body.push(block('normal', [span(line)]))
  }
}

const count = (test) => body.filter(test).length
console.log(
  `${file}: ${count((b) => b.style === 'h2')} groups, ${count((b) => b.style === 'h3')} clauses, ${count((b) => b.style === 'h4')} sub-clauses, ${count((b) => b.listItem)} lettered items, ${count((b) => b.style === 'normal' && !b.listItem)} paragraphs`,
)
if (dry) {
  for (const b of body.slice(0, 40)) console.log(`${(b.listItem ? 'li' : b.style).padEnd(6)} ${b.children.map((c) => c.text).join('').slice(0, 90)}`)
  process.exit(0)
}

const client = getCliClient({apiVersion: '2025-01-01'})
const id = `legalPage-${slug}`
const existing = await client.fetch(`{"rank": *[_id == $id][0].orderRank, "count": count(*[_type == "legalPage"])}`, {id})
await client.createOrReplace({
  _id: id,
  _type: 'legalPage',
  title,
  slug: {_type: 'slug', current: slug},
  orderRank: existing.rank ?? `0|h${String(existing.count).padStart(5, '0')}:`,
  body,
})
console.log(`Published ${id} at /${slug}.`)
