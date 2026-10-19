/**
 * Tiny pixel-art renderer. Rows are strings; each character maps to a
 * colour in the palette, "." is transparent, "x" follows currentColor.
 * Returns an inline SVG string drawn with crisp edges.
 */
export const PALETTE: Record<string, string> = {
	k: '#1e1d1e', // ink
	w: '#f2f2f2', // paper
	l: '#bdff3b', // lime
	s: '#64737a', // slate
	r: '#ff5a5f', // the dog's collar
	x: 'currentColor',
};

export function pixels(rows: string[], scale = 3, attrs = ''): string {
	const h = rows.length;
	const w = Math.max(...rows.map((r) => r.length));
	const rects: string[] = [];
	rows.forEach((row, y) => {
		[...row].forEach((ch, x) => {
			const fill = PALETTE[ch];
			if (!fill) return;
			rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
		});
	});
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" ${attrs}>${rects.join('')}</svg>`;
}
