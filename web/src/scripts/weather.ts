import sun from '../assets/icons/weather/sun.svg?raw';
import moon from '../assets/icons/weather/moon.svg?raw';
import partlyDay from '../assets/icons/weather/partly-day.svg?raw';
import partlyNight from '../assets/icons/weather/partly-night.svg?raw';
import cloud from '../assets/icons/weather/cloud.svg?raw';
import fog from '../assets/icons/weather/fog.svg?raw';
import drizzle from '../assets/icons/weather/drizzle.svg?raw';
import rain from '../assets/icons/weather/rain.svg?raw';
import snow from '../assets/icons/weather/snow.svg?raw';
import storm from '../assets/icons/weather/storm.svg?raw';
import wind from '../assets/icons/weather/wind.svg?raw';

/**
 * Weather in Joondalup from Open-Meteo (free, no key) drawn with Microsoft's
 * Fluent weather icons (MIT, see assets/icons/weather/LICENSE.md) in the
 * brand colour, plus a small analogue clock on Perth time. Both live beside
 * the menu button. The icons are still.
 */

const LAT = -31.7446;
const LON = 115.7661;
const TZ = 'Australia/Perth';
const CACHE_KEY = 'idp.weather';
const CACHE_MS = 10 * 60 * 1000;

interface Current {
	temperature_2m: number;
	weather_code: number;
	is_day: number;
	wind_speed_10m: number;
}

interface Reading {
	icon: string;
	kind: string;
	label: string;
	temp: number;
}


/** WMO weather code to a line icon and a short label. */
function describe(current: Current): Reading {
	const { weather_code: code, wind_speed_10m: windSpeed } = current;
	const day = current.is_day === 1;
	const temp = Math.round(current.temperature_2m);
	const pick = (icon: string, kind: string, label: string): Reading => ({ icon, kind, label, temp });
	if (windSpeed >= 30 && code <= 3) return pick(wind, 'wind', 'Windy');
	if (code === 0) return day ? pick(sun, 'sun', 'Sunny') : pick(moon, 'moon', 'Clear');
	if (code === 1 || code === 2) return day ? pick(partlyDay, 'cloud', 'Partly cloudy') : pick(partlyNight, 'cloud', 'Partly cloudy');
	if (code === 3) return pick(cloud, 'cloud', 'Overcast');
	if (code === 45 || code === 48) return pick(fog, 'cloud', 'Fog');
	if (code >= 51 && code <= 57) return pick(drizzle, 'rain', 'Drizzle');
	if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return pick(rain, 'rain', 'Rain');
	if ((code >= 71 && code <= 77) || code === 85 || code === 86) return pick(snow, 'rain', 'Snow');
	if (code >= 95) return pick(storm, 'storm', 'Storms');
	return pick(cloud, 'cloud', 'Weather');
}

async function fetchCurrent(): Promise<Current | null> {
	try {
		const cached = sessionStorage.getItem(CACHE_KEY);
		if (cached) {
			const { at, data } = JSON.parse(cached) as { at: number; data: Current };
			if (Date.now() - at < CACHE_MS) return data;
		}
	} catch {
		// ignore
	}
	try {
		const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,is_day,wind_speed_10m&timezone=${encodeURIComponent(TZ)}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		const json = (await res.json()) as { current: Current };
		try {
			sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: json.current }));
		} catch {
			// ignore
		}
		return json.current;
	} catch {
		return null;
	}
}

export function perthTime(): string {
	return new Intl.DateTimeFormat('en-AU', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date()).replace(/\s/g, '');
}

export function initWeather() {
	const widgets = Array.from(document.querySelectorAll<HTMLElement>('[data-weather]'));

	void fetchCurrent().then((current) => {
		if (!current) return;
		const reading = describe(current);
		widgets.forEach((w) => {
			const icon = w.querySelector<HTMLElement>('[data-weather-icon]');
			const temp = w.querySelector<HTMLElement>('[data-weather-temp]');
			if (icon) {
				icon.innerHTML = reading.icon;
				icon.dataset.kind = reading.kind;
			}
			if (temp) temp.textContent = `${reading.temp}°`;
			w.title = `${reading.label}, ${reading.temp}°C in Joondalup`;
			w.classList.add('is-ready');
		});
	});

	// Clock
	const clocks = Array.from(document.querySelectorAll<HTMLElement>('[data-clock]'));
	if (!clocks.length) return;
	const tick = () => {
		const now = new Date();
		const parts = new Intl.DateTimeFormat('en-AU', {
			timeZone: TZ,
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		}).formatToParts(now);
		const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
		const h = get('hour') % 12;
		const m = get('minute');
		const s = get('second');
		clocks.forEach((clock) => {
			clock.querySelector<SVGElement>('[data-hand="hour"]')?.setAttribute('transform', `rotate(${h * 30 + m * 0.5} 16 16)`);
			clock.querySelector<SVGElement>('[data-hand="minute"]')?.setAttribute('transform', `rotate(${m * 6 + s * 0.1} 16 16)`);
			clock.querySelector<SVGElement>('[data-hand="second"]')?.setAttribute('transform', `rotate(${s * 6} 16 16)`);
		});
		const text = perthTime();
		document.querySelectorAll<HTMLElement>('[data-clock-text]').forEach((el) => (el.textContent = text));
	};
	tick();
	window.setInterval(tick, 1000);
}
