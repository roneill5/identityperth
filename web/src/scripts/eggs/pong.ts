import { burst } from './confetti';
import { reducedMotion } from '../motion';

/**
 * Pong on the 404 page. The keyboard moves the left paddle (W and S, or the
 * arrow keys; space serves), with a finger on touch screens. The computer
 * plays the right and gets sharper as rallies grow. First to five. Points
 * serve themselves. Blips are synthesised, no audio files.
 */
export function initPong(canvas: HTMLCanvasElement): () => void {
	const ctx = canvas.getContext('2d');
	if (!ctx) return () => {};

	const css = getComputedStyle(document.documentElement);
	const INK = css.getPropertyValue('--color-ink').trim() || '#1e1d1e';
	const PAPER = css.getPropertyValue('--color-paper').trim() || '#f2f2f2';
	const LIME = css.getPropertyValue('--color-lime').trim() || '#bdff3b';
	const FONT = css.getPropertyValue('--font-display').trim() || 'sans-serif';
	const TARGET = 5;
	const arena = canvas.parentElement;

	let W = 0;
	let H = 0;
	const resize = () => {
		const rect = canvas.getBoundingClientRect();
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		W = rect.width;
		H = rect.height;
		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		draw();
	};

	type State = 'idle' | 'serving' | 'playing' | 'over';
	let state: State = 'idle';
	const pad = { w: 0, h: 0, inset: 0 };
	const player = { y: 0, flash: 0 };
	const cpu = { y: 0, flash: 0, error: 0 };
	const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 6 };
	const trail: Array<{ x: number; y: number }> = [];
	const score = { player: 0, cpu: 0 };
	let rally = 0;
	let keys = 0;
	let frame = 0;
	let last = 0;
	let serveAt = 0;
	let shakeUntil = 0;
	let flashUntil = 0;
	let winner: 'player' | 'cpu' | null = null;
	let audio: AudioContext | null = null;

	const metrics = () => {
		pad.w = Math.max(8, Math.round(W * 0.012));
		pad.h = Math.round(H * 0.2);
		pad.inset = Math.round(W * 0.04);
		ball.r = Math.max(5, Math.round(W * 0.009));
	};
	const centre = () => {
		player.y = H / 2 - pad.h / 2;
		cpu.y = H / 2 - pad.h / 2;
	};
	const serve = (toward: 1 | -1) => {
		ball.x = W / 2;
		ball.y = H / 2;
		const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
		const speed = Math.max(300, W * 0.5);
		ball.vx = Math.cos(angle) * speed * toward;
		ball.vy = Math.sin(angle) * speed;
		rally = 0;
		cpu.error = (Math.random() - 0.5) * pad.h * 0.6;
		trail.length = 0;
	};

	const beep = (freq: number, duration = 0.06, type: OscillatorType = 'square', volume = 0.05) => {
		try {
			audio ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
			const osc = audio.createOscillator();
			const gain = audio.createGain();
			osc.type = type;
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(volume, audio.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
			osc.connect(gain).connect(audio.destination);
			osc.start();
			osc.stop(audio.currentTime + duration);
		} catch {
			// no sound, no problem
		}
	};

	const text = (str: string, size: number, x: number, y: number, colour: string, align: CanvasTextAlign = 'center', alpha = 1) => {
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.font = `${Math.round(size)}px ${FONT}`;
		ctx.fillStyle = colour;
		ctx.textAlign = align;
		ctx.textBaseline = 'middle';
		ctx.fillText(str.toUpperCase(), x, y);
		ctx.restore();
	};

	const draw = () => {
		const now = performance.now();
		ctx.fillStyle = now < flashUntil ? '#2b2a2b' : INK;
		ctx.fillRect(0, 0, W, H);

		// Centre line and scores
		ctx.strokeStyle = PAPER;
		ctx.globalAlpha = 0.25;
		ctx.setLineDash([Math.max(4, H * 0.02), Math.max(6, H * 0.03)]);
		ctx.beginPath();
		ctx.moveTo(W / 2, 0);
		ctx.lineTo(W / 2, H);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
		text('You', H * 0.045, W * 0.25, H * 0.09, PAPER, 'center', 0.5);
		text('Computer', H * 0.045, W * 0.75, H * 0.09, PAPER, 'center', 0.5);
		text(String(score.player), H * 0.3, W * 0.25, H * 0.27, PAPER, 'center', 0.9);
		text(String(score.cpu), H * 0.3, W * 0.75, H * 0.27, PAPER, 'center', 0.9);

		// Paddles
		ctx.fillStyle = now < player.flash ? LIME : PAPER;
		ctx.fillRect(pad.inset, player.y, pad.w, pad.h);
		ctx.fillStyle = now < cpu.flash ? LIME : PAPER;
		ctx.fillRect(W - pad.inset - pad.w, cpu.y, pad.w, pad.h);

		// Ball and trail
		if (state === 'playing' || state === 'serving') {
			trail.forEach((p, i) => {
				const a = (i + 1) / (trail.length + 1);
				ctx.globalAlpha = a * 0.35;
				const r = ball.r * (0.5 + a * 0.5);
				ctx.fillStyle = LIME;
				ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
			});
			ctx.globalAlpha = 1;
			ctx.fillStyle = LIME;
			ctx.fillRect(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
		}

		// Messages
		if (state === 'idle') {
			text('Pong', H * 0.22, W / 2, H * 0.52, PAPER, 'center', 0.95);
			text('Press space to play', H * 0.055, W / 2, H * 0.72, LIME);
			text(`W and S or the arrow keys. First to ${TARGET}.`, H * 0.045, W / 2, H * 0.81, PAPER, 'center', 0.55);
		} else if (state === 'over') {
			text(winner === 'player' ? 'You win' : 'Computer wins', H * 0.2, W / 2, H * 0.52, winner === 'player' ? LIME : PAPER);
			text('Space to play again', H * 0.055, W / 2, H * 0.72, winner === 'player' ? PAPER : LIME, 'center', 0.9);
		}
	};

	const deflect = (paddleY: number, who: 'player' | 'cpu') => {
		const rel = (ball.y - (paddleY + pad.h / 2)) / (pad.h / 2);
		const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.05, W * 1.15);
		const angle = Math.max(-0.4, Math.min(0.4, rel * 0.4)) * Math.PI;
		const dir = who === 'player' ? 1 : -1;
		ball.vx = Math.cos(angle) * speed * dir;
		ball.vy = Math.sin(angle) * speed;
		rally += 1;
		(who === 'player' ? player : cpu).flash = performance.now() + 120;
		if (who === 'cpu') cpu.error = (Math.random() - 0.5) * pad.h * Math.max(0.15, 0.7 - rally * 0.05);
		beep(who === 'player' ? 520 : 440);
	};

	const point = (who: 'player' | 'cpu') => {
		score[who] += 1;
		shakeUntil = performance.now() + 220;
		flashUntil = performance.now() + 120;
		beep(who === 'player' ? 660 : 180, 0.18, who === 'player' ? 'square' : 'sawtooth', 0.06);
		if (score[who] >= TARGET) {
			state = 'over';
			winner = who;
			if (who === 'player') burst();
			draw();
			return;
		}
		state = 'serving';
		serveAt = performance.now() + 900;
		serve(who === 'player' ? -1 : 1);
	};

	const step = (now: number) => {
		const dt = Math.min(0.03, (now - last) / 1000 || 0);
		last = now;

		if (keys) player.y = clamp(player.y + keys * H * 0.9 * dt, 0, H - pad.h);

		if (state === 'serving' && now >= serveAt) state = 'playing';

		if (state === 'playing') {
			// The computer chases the ball with a top speed and a little error.
			const aim = ball.vx > 0 ? ball.y - pad.h / 2 + cpu.error : H / 2 - pad.h / 2;
			const maxStep = H * (0.55 + Math.min(rally, 12) * 0.035) * dt;
			cpu.y = clamp(cpu.y + clamp(aim - cpu.y, -maxStep, maxStep), 0, H - pad.h);

			trail.push({ x: ball.x, y: ball.y });
			if (trail.length > 7) trail.shift();
			ball.x += ball.vx * dt;
			ball.y += ball.vy * dt;
			if (ball.y - ball.r <= 0 || ball.y + ball.r >= H) {
				ball.y = clamp(ball.y, ball.r, H - ball.r);
				ball.vy *= -1;
				beep(300, 0.04, 'triangle', 0.04);
			}
			const hits = (px: number, py: number) =>
				ball.x - ball.r < px + pad.w && ball.x + ball.r > px && ball.y + ball.r > py && ball.y - ball.r < py + pad.h;
			if (ball.vx < 0 && hits(pad.inset, player.y)) {
				ball.x = pad.inset + pad.w + ball.r;
				deflect(player.y, 'player');
			} else if (ball.vx > 0 && hits(W - pad.inset - pad.w, cpu.y)) {
				ball.x = W - pad.inset - pad.w - ball.r;
				deflect(cpu.y, 'cpu');
			}
			if (ball.x < -ball.r * 4) point('cpu');
			else if (ball.x > W + ball.r * 4) point('player');
		}

		if (arena) {
			if (now < shakeUntil && !reducedMotion()) {
				arena.style.transform = `translate(${(Math.random() - 0.5) * 6}px, ${(Math.random() - 0.5) * 6}px)`;
			} else {
				arena.style.transform = '';
			}
		}

		draw();
		if (state === 'playing' || state === 'serving') frame = requestAnimationFrame(step);
		else if (now < shakeUntil) frame = requestAnimationFrame(step);
	};

	const start = () => {
		if (state === 'playing' || state === 'serving') return;
		if (state === 'over') {
			score.player = 0;
			score.cpu = 0;
			winner = null;
		}
		centre();
		serve(1);
		state = 'serving';
		serveAt = performance.now() + 700;
		last = performance.now();
		beep(520, 0.05);
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(step);
	};

	// Touch screens have no keys: a finger on the arena moves the paddle.
	const onPointer = (e: PointerEvent) => {
		if (e.pointerType !== 'touch') return;
		const rect = canvas.getBoundingClientRect();
		player.y = clamp(e.clientY - rect.top - pad.h / 2, 0, H - pad.h);
		if (state === 'idle' || state === 'over') draw();
	};
	const onKeyDown = (e: KeyboardEvent) => {
		if ((e.target as HTMLElement | null)?.closest('input, textarea')) return;
		if (e.key === 'ArrowUp' || e.key === 'w') { keys = -1; e.preventDefault(); }
		else if (e.key === 'ArrowDown' || e.key === 's') { keys = 1; e.preventDefault(); }
		else if (e.key === ' ') { start(); e.preventDefault(); }
	};
	const onKeyUp = (e: KeyboardEvent) => {
		if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) keys = 0;
	};
	const onVisibility = () => {
		if (document.hidden && (state === 'playing' || state === 'serving')) {
			state = 'serving';
			serveAt = performance.now() + 1500;
		}
	};

	canvas.addEventListener('pointermove', onPointer);
	canvas.addEventListener('pointerdown', (e) => {
		onPointer(e);
		if (e.pointerType === 'touch') start();
	});
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
	window.addEventListener('resize', resize);
	document.addEventListener('visibilitychange', onVisibility);

	resize();
	metrics();
	centre();
	draw();
	const onResizeMetrics = () => {
		metrics();
		centre();
	};
	window.addEventListener('resize', onResizeMetrics);

	return () => {
		cancelAnimationFrame(frame);
		canvas.removeEventListener('pointermove', onPointer);
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('keyup', onKeyUp);
		window.removeEventListener('resize', resize);
		window.removeEventListener('resize', onResizeMetrics);
		document.removeEventListener('visibilitychange', onVisibility);
		void audio?.close();
	};
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
