/** Where Thinking lives until there is enough writing to publish here. */
export const THINKING_URL = 'https://substack.com';

/** Fixed site navigation. The menu order comes from the design, not the CMS. */
export const NAV = [
	{ label: 'Projects', href: '/projects', external: false },
	{ label: 'Studio', href: '/studio', external: false },
	{ label: 'Gallery', href: '/gallery', external: false },
	{ label: 'Thinking', href: THINKING_URL, external: true },
] as const;

export type NavItem = (typeof NAV)[number];

/** The sections that are pages on this site. */
export const INTERNAL_NAV = NAV.filter((item) => !item.external);

export function isActive(pathname: string, href: string): boolean {
	return !href.startsWith('http') && (pathname === href || pathname.startsWith(`${href}/`));
}
