/** Paragraphs of a plain text field, split on blank lines (e.g. a project summary). */
export function paragraphs(text?: string | null): string[] {
	return (text ?? '')
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean);
}

/**
 * A search-result description from a longer text: whole sentences up to about
 * 155 characters (what Google shows before it cuts off), or, when the first
 * sentence alone is longer, that sentence cut at a word with an ellipsis.
 */
export function snippet(text: string, max = 155): string {
	if (text.length <= max) return text;
	let out = '';
	for (const sentence of text.match(/.*?[.!?](?=\s|$)|.+$/gs) ?? []) {
		if ((out + sentence).trim().length > max) break;
		out += sentence;
	}
	out = out.trim();
	if (out.length >= 60) return out;
	const cut = text.slice(0, max - 1);
	return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:]+$/, '')}…`;
}
