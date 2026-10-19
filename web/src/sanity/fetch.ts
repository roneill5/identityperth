import { client } from './client';
import { SETTINGS_QUERY } from './queries';

let settingsPromise: ReturnType<typeof fetchSettings> | null = null;

async function fetchSettings() {
	return client.fetch(SETTINGS_QUERY);
}

/** Site settings are needed by every page, so fetch them once per build. */
export function getSettings() {
	settingsPromise ??= fetchSettings();
	return settingsPromise;
}
