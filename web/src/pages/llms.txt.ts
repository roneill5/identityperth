import type { APIRoute } from 'astro';
import { client } from '../sanity/client';
import { paragraphs } from '../lib/text';
import { SITE_NAME } from '../lib/site';

/**
 * /llms.txt: the site in plain Markdown for AI assistants (llmstxt.org): who
 * Identity is, what it does, where it is and every project with its link.
 * Built from the CMS with the rest of the site, so it never goes stale; no
 * search engine is known to read it, so it earns nothing a page does not
 * (Ross, 5 Nov).
 */
interface Content {
	settings: {
		tagline?: string | null;
		email?: string | null;
		careersEmail?: string | null;
		phone?: string | null;
		address?: string | null;
		description?: string | null;
		socials?: { label?: string | null; url?: string | null }[] | null;
	} | null;
	about: { body?: string | null; clients?: string[] | null } | null;
	services: { title?: string | null; description?: string | null }[];
	team: { name?: string | null; role?: string | null }[];
	projects: { title?: string | null; slug?: string | null; tagline?: string | null; client?: string | null; services?: string[] | null }[];
	legal: { title?: string | null; slug?: string | null }[];
}

const QUERY = `{
  "settings": *[_id == "siteSettings"][0]{ tagline, email, careersEmail, phone, address, socials[]{ label, url }, "description": seo.description },
  "about": *[_id == "studio"][0]{ "body": pt::text(aboutBody), clients },
  "services": *[_type == "service"] | order(orderRank){ title, description },
  "team": *[_type == "teamMember"] | order(orderRank){ name, role },
  "projects": *[_type == "project" && defined(slug.current)] | order(orderRank){ title, "slug": slug.current, tagline, "client": client->name, "services": services[]->title },
  "legal": *[_type == "legalPage" && defined(slug.current)] | order(orderRank){ title, "slug": slug.current }
}`;

/** One line of Markdown: no line breaks, and nothing that would close a link label early. */
const line = (text?: string | null) => (text ?? '').replace(/\s+/g, ' ').replace(/[[\]]/g, '').trim();

export const GET: APIRoute = async ({ site }) => {
	const { settings, about, services, team, projects, legal } = await client.fetch<Content>(QUERY);
	const url = (path: string) => new URL(path, site).href;
	const out: string[] = [`# ${SITE_NAME}`, ''];

	if (settings?.description) out.push(`> ${line(settings.description)}`, '');
	for (const p of paragraphs(about?.body)) out.push(line(p), '');

	const contact = [
		settings?.address && `Studio: ${line(settings.address.replace(/,?\n/g, ', '))}, Australia`,
		settings?.email && `Enquiries: ${line(settings.email)}`,
		settings?.phone && `Phone: ${line(settings.phone)}`,
		settings?.careersEmail && `Careers: ${line(settings.careersEmail)}`,
		...(settings?.socials ?? []).filter((s) => s.label && s.url).map((s) => `${line(s.label)}: ${s.url}`),
	].filter(Boolean);
	if (contact.length) out.push(...contact.map((c) => `- ${c}`), '');

	out.push(
		'## Pages',
		'',
		`- [Projects](${url('/projects/')}): case studies of brand, campaign, digital and content work`,
		`- [Studio](${url('/studio/')}): about Identity, its services, team, clients and contact details`,
		`- [Gallery](${url('/gallery/')}): a wall of images from the studio and its work`,
		'',
	);

	if (services.length) {
		out.push('## Services', '');
		// The first paragraph of a service lists what it covers; the second is how Identity goes about it.
		for (const s of services) if (s.title) out.push(`- ${line(s.title)}: ${paragraphs(s.description).map(line).join(' ')}`);
		out.push('');
	}

	if (projects.length) {
		out.push('## Projects', '');
		for (const p of projects) {
			if (!p.title || !p.slug) continue;
			const notes = [line(p.tagline), p.client && line(p.client) !== line(p.title) && `Client: ${line(p.client)}.`, p.services?.length && `Services: ${p.services.map(line).join(', ')}.`].filter(Boolean);
			out.push(`- [${line(p.title)}](${url(`/projects/${p.slug}/`)})${notes.length ? `: ${notes.join(' ')}` : ''}`);
		}
		out.push('');
	}

	if (team.length) {
		out.push('## Team', '');
		for (const m of team) if (m.name) out.push(`- ${line(m.name)}${m.role ? `, ${line(m.role)}` : ''}`);
		out.push('');
	}

	if (about?.clients?.length) out.push('## Clients', '', about.clients.map(line).filter(Boolean).join(', '), '');

	if (legal.length) {
		out.push('## Optional', '');
		for (const l of legal) if (l.title && l.slug) out.push(`- [${line(l.title)}](${url(`/${l.slug}/`)})`);
		out.push('');
	}

	return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
