import { stegaClean } from '@sanity/client/stega';

/** The name in page titles, share cards and structured data. */
export const SITE_NAME = 'Identity Perth';

/** Only the production domain is indexable and gets no staging headers. */
export const isProductionHost = (hostname: string): boolean => /^(www\.)?identityperth\.com$/.test(hostname);

/**
 * A link typed into the CMS, or null when it is not a web, mail or phone
 * address (the Studio checks this too, but only in the browser).
 */
export function safeHref(href?: string | null): string | null {
	const value = stegaClean(href ?? '').trim();
	return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) ? value : null;
}

/**
 * Fixed site navigation. The menu order comes from the design, not the CMS.
 * Thinking is hidden until stage two, after launch (Nick, 28 Oct); to bring
 * it back, add { label: 'Thinking', href: '/thinking', ... } at the end, or
 * an https:// address with `external: true` to open it in a new tab.
 * `prefetch: false` keeps the router from fetching a link ahead of a click.
 * Internal links end in a slash, the address each page really has: the
 * no-slash form is a 307, and Google indexed that instead of the page (Nov 2026).
 */
export const NAV = [
	{ label: 'Projects', href: '/projects/', external: false, prefetch: true },
	{ label: 'Studio', href: '/studio/', external: false, prefetch: true },
	{ label: 'Gallery', href: '/gallery/', external: false, prefetch: true },
] as const;

/**
 * Whether the menu's contact column and the legal pages' footer link to the
 * privacy policy. False keeps /privacy reachable by address while its text is
 * under review (used on 4 Nov until Nick confirmed it).
 */
export const PRIVACY_LINKED = true;

export type NavItem = (typeof NAV)[number];

/** The sections that are pages on this site. */
export const INTERNAL_NAV = NAV.filter((item) => !item.external);

export function isActive(pathname: string, href: string): boolean {
	const base = href.replace(/\/$/, '');
	return !href.startsWith('http') && (pathname === base || pathname.startsWith(`${base}/`));
}
