import { stegaClean } from '@sanity/client/stega';

interface Span {
	text?: string | null;
}
export interface TextBlock {
	_type?: string;
	style?: string | null;
	listItem?: string | null;
	children?: Span[] | null;
}

/** The plain words of a Portable Text block. */
export function blockText(block: TextBlock | null | undefined): string {
	return (block?.children ?? []).map((child) => child.text ?? '').join('');
}

/** A stable id for a heading, for jump links: "2. Scope of services" becomes "2-scope-of-services". */
export function headingId(text: string): string {
	return (
		stegaClean(text)
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'section'
	);
}
