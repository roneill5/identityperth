import { gsap, reducedMotion } from '../motion';
import { pixels } from './pixel';

/**
 * The dog. A short room along the bottom of Projects, Studio and Gallery:
 * a door on the left, a living room in the middle (plant, table and chairs,
 * rug, television) and a sofa on the right, all drawn in paper on ink (the
 * collar is the one splash of colour). When
 * the room scrolls into view the door opens and the dog trots out. It
 * only moves sideways, following the cursor. Lead it to the sofa and it
 * hops up, curls up and sleeps. Pat it for a heart.
 */

const SCALE = 2;

const DOG: Record<string, string[]> = {
	walk1: [
		'.........w..w...',
		'........wwwwww..',
		'........wwwkww..',
		'.w......wwwwwwww',
		'.ww.....wwwwwwwk',
		'..wwwwwwwrrrrww.',
		'..wwwwwwwwwwwww.',
		'..wwwwwwwwwwwww.',
		'..wwwwwwwwwwwww.',
		'..ww..ww...ww.ww',
		'..ww..ww...ww.ww',
		'..ww..ww...ww.ww',
	],
	walk2: [
		'.........w..w...',
		'........wwwwww..',
		'........wwwkww..',
		'..w.....wwwwwwww',
		'.ww.....wwwwwwwk',
		'..wwwwwwwrrrrww.',
		'..wwwwwwwwwwwww.',
		'..wwwwwwwwwwwww.',
		'..wwwwwwwwwwwww.',
		'...ww.ww....wwww',
		'...ww.ww....ww.w',
		'...ww.ww....ww.w',
	],
	sit: [
		'.........w..w...',
		'........wwwwww..',
		'........wwwkww..',
		'........wwwwwwww',
		'........wwwwwwwk',
		'.w......wrrrrww.',
		'.ww....wwwwwwww.',
		'..wwwwwwwwwwwww.',
		'..wwwwwwwwwwwww.',
		'..wwwwwwwww.ww..',
		'...ww......ww...',
		'...ww......ww...',
	],
	sleep: [
		'................',
		'................',
		'................',
		'................',
		'................',
		'................',
		'.........w..w...',
		'.ww.....wwwwwww.',
		'.wwwwwwwwwwwwwwk',
		'wwwwwwwwwrrrrwww',
		'wwwwwwwwwwwwwww.',
		'.wwwwwwwwwwwww..',
	],
};

const DOOR_CLOSED = [
	'wwwwwwwwwwww',
	'wkkkkkkkkkkw',
	'wkwwwwwwwwkw',
	'wkwkkkkkkwkw',
	'wkwkkkkkkwkw',
	'wkwkkkkkkwkw',
	'wkwkkkkkkwkw',
	'wkwwwwwwwwkw',
	'wkkkkkkkkkkw',
	'wkwwwwwwwwkw',
	'wkwkkkkkkwkw',
	'wkwkkkkkkwkw',
	'wkwkkkkklwkw',
	'wkwkkkkkkwkw',
	'wkwkkkkkkwkw',
	'wkwkkkkkkwkw',
	'wkwwwwwwwwkw',
	'wkkkkkkkkkkw',
	'wkkkkkkkkkkw',
	'wwwwwwwwwwww',
];

const DOOR_OPEN = [
	'wwwwwwwwwwww',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwlkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwkw',
	'wwwwwwwwwwww',
];

const SOFA = [
	'....wwwwwwwwwwwwwwwwwwww....',
	'...w....................w...',
	'...w....................w...',
	'...w....................w...',
	'.www....................www.',
	'w..w....................w..w',
	'w..wwwwwwwwwwwwwwwwwwwwww..w',
	'w..w.........w..........w..w',
	'w..w.........w..........w..w',
	'w..wwwwwwwwwwwwwwwwwwwwww..w',
	'wwwwwwwwwwwwwwwwwwwwwwwwwwww',
	'.ww......................ww.',
	'.ww......................ww.',
];
const SOFA_SEAT_ROW = 6; // the dog's paws land on this row

const TABLE = [
	'wwwwwwwwwwwwwwww',
	'wwwwwwwwwwwwwwww',
	'.w............w.',
	'.w............w.',
	'.w............w.',
	'.w............w.',
	'.w............w.',
	'.w............w.',
	'.w............w.',
];

const CHAIR = [
	'wwwww.',
	'w...w.',
	'w...w.',
	'w...w.',
	'wwwwww',
	'wwwwww',
	'w....w',
	'w....w',
	'w....w',
	'w....w',
	'w....w',
	'w....w',
];

const TV = [
	'wwwwwwwwwwwwwwwwww',
	'wllllllllllllllllw',
	'wllllllllllllllllw',
	'wllllllllllllllllw',
	'wllllllllllllllllw',
	'wllllllllllllllllw',
	'wllllllllllllllllw',
	'wllllllllllllllllw',
	'wllllllllllllllllw',
	'wwwwwwwwwwwwwwwwww',
	'........ww........',
	'........ww........',
	'...wwwwwwwwwwww...',
	'...w..........w...',
	'...w..........w...',
	'...wwwwwwwwwwww...',
];

const RUG = [
	'wwwwwwwwwwwwwwwwwwwwwwwwwwww',
	'w.w.w.w.w.w.w.w.w.w.w.w.w.w.',
	'wwwwwwwwwwwwwwwwwwwwwwwwwwww',
];

const PLANT = [
	'...ww...',
	'..w..w..',
	'.w.ww.w.',
	'.w.ww.w.',
	'..wwww..',
	'...ww...',
	'...ww...',
	'.wwwwww.',
	'.w....w.',
	'.w....w.',
	'..w..w..',
	'..wwww..',
];

const Z = ['wwwww', '....w', '..ww.', '.w...', 'wwwww'];

const HEART = ['.ww.ww.', 'wwwwwww', 'wwwwwww', '.wwwww.', '..www..', '...w...'];

type State = 'closed' | 'out' | 'following' | 'hopping' | 'asleep';

export function initDog(zone: HTMLElement): () => void {
	zone.classList.add('dog-room');
	const mirror = (rows: string[]) => rows.map((r) => [...r].reverse().join(''));
	zone.innerHTML = `
		<span class="dog-room__door" data-door>${pixels(DOOR_CLOSED, SCALE, 'data-frame="closed"')}${pixels(DOOR_OPEN, SCALE, 'data-frame="open"')}</span>
		<span class="dog-room__item dog-room__plant">${pixels(PLANT, SCALE)}</span>
		<span class="dog-room__item dog-room__dining">${pixels(CHAIR, SCALE)}${pixels(TABLE, SCALE)}${pixels(mirror(CHAIR), SCALE)}</span>
		<span class="dog-room__item dog-room__rug">${pixels(RUG, SCALE)}</span>
		<span class="dog-room__item dog-room__tv">${pixels(TV, SCALE)}</span>
		<span class="dog-room__sofa" data-sofa>${pixels(SOFA, SCALE)}</span>
		<span class="dog-room__zzz" data-zzz aria-hidden="true">${[1.5, 2, 2.5].map((s) => pixels(Z, s)).join('')}</span>
		<button type="button" class="dog-room__dog" data-dog-sprite aria-label="A small pixel dog">${Object.keys(DOG)
			.map((name) => pixels(DOG[name], SCALE, `data-frame="${name}"`))
			.join('')}</button>
		<span class="dog-room__floor"></span>`;

	const door = zone.querySelector<HTMLElement>('[data-door]')!;
	const sofa = zone.querySelector<HTMLElement>('[data-sofa]')!;
	const dog = zone.querySelector<HTMLButtonElement>('[data-dog-sprite]')!;
	const frames = Array.from(dog.querySelectorAll<SVGElement>('svg'));
	const doorFrames = Array.from(door.querySelectorAll<SVGElement>('svg'));

	const showFrame = (name: string) => frames.forEach((f) => (f.style.display = f.dataset.frame === name ? 'block' : 'none'));
	const showDoor = (name: string) => doorFrames.forEach((f) => (f.style.display = f.dataset.frame === name ? 'block' : 'none'));

	const DOG_W = 16 * SCALE;
	const SEAT_LIFT = (SOFA.length - SOFA_SEAT_ROW) * SCALE - SCALE; // paws on the cushion
	let state: State = 'closed';
	let x = 0;
	let target = 0;
	let step = 0;
	let timer = 0;
	let facing = 1;

	const bounds = () => {
		const z = zone.getBoundingClientRect();
		const d = door.getBoundingClientRect();
		const s = sofa.getBoundingClientRect();
		return {
			zoneLeft: z.left,
			min: d.right - z.left - DOG_W * 0.3,
			max: s.left - z.left + 8,
			sofaSeat: s.left - z.left + (s.width - DOG_W) / 2,
		};
	};

	const place = () => gsap.set(dog, { x: Math.round(x), y: 0, scaleX: facing });

	const tick = () => {
		if (state !== 'following') return;
		const b = bounds();
		const goal = Math.max(b.min, Math.min(b.max, target));
		const dx = goal - x;
		if (Math.abs(dx) < 3) {
			showFrame('sit');
		} else {
			facing = dx < 0 ? -1 : 1;
			x += Math.sign(dx) * Math.min(Math.abs(dx), 12);
			step += 1;
			showFrame(step % 2 ? 'walk1' : 'walk2');
		}
		place();
		if (x >= b.max - 2) hop(b.sofaSeat);
	};

	/** Up onto the sofa, then curl up. */
	const hop = (seat: number) => {
		state = 'hopping';
		window.clearInterval(timer);
		facing = 1;
		showFrame('walk2');
		const settle = () => {
			state = 'asleep';
			x = seat;
			showFrame('sleep');
			gsap.set(dog, { x: seat, y: -SEAT_LIFT, scaleX: 1 });
			zone.classList.add('is-asleep');
		};
		if (reducedMotion()) return settle();
		gsap
			.timeline({ onComplete: settle })
			.to(dog, { x: seat, duration: 0.55, ease: 'power1.inOut' }, 0)
			.to(dog, { y: -SEAT_LIFT - 14, duration: 0.3, ease: 'power2.out' }, 0)
			.to(dog, { y: -SEAT_LIFT, duration: 0.25, ease: 'power2.in' }, 0.3);
	};

	const comeOut = () => {
		if (state !== 'closed') return;
		state = 'out';
		showDoor('open');
		const b = bounds();
		x = b.min - DOG_W * 0.5;
		target = b.min + 40;
		dog.hidden = false;
		showFrame('walk1');
		place();
		window.setTimeout(() => {
			state = 'following';
			timer = window.setInterval(tick, 80);
			window.setTimeout(() => showDoor('closed'), 1800);
		}, 350);
	};

	showDoor('closed');
	showFrame('sit');
	dog.hidden = true;

	const observer = new IntersectionObserver(
		([entry]) => {
			if (entry?.isIntersecting) window.setTimeout(comeOut, 400);
		},
		{ threshold: 0.6 },
	);
	observer.observe(zone);

	const onPointer = (e: PointerEvent) => {
		if (state !== 'following') return;
		target = e.clientX - bounds().zoneLeft - DOG_W / 2;
	};
	window.addEventListener('pointermove', onPointer, { passive: true });
	window.addEventListener('pointerdown', onPointer, { passive: true });

	// A pat: a pixel heart floats up from the dog.
	const onPat = () => {
		const heart = document.createElement('span');
		heart.className = 'dog-room__heart';
		heart.innerHTML = pixels(HEART, 2);
		heart.style.left = `${x + DOG_W / 2 - 7}px`;
		heart.style.bottom = `${(state === 'asleep' ? SEAT_LIFT : 0) + 12 * SCALE + 10}px`;
		zone.appendChild(heart);
		window.setTimeout(() => heart.remove(), 1000);
	};
	dog.addEventListener('click', onPat);

	return () => {
		observer.disconnect();
		window.removeEventListener('pointermove', onPointer);
		window.removeEventListener('pointerdown', onPointer);
		window.clearInterval(timer);
		gsap.killTweensOf(dog);
		zone.innerHTML = '';
		zone.classList.remove('dog-room', 'is-asleep');
	};
}
