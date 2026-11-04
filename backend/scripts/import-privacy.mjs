// Creates (or replaces) the Privacy Policy legal page at /privacy. The text lives
// here so it can be reviewed and versioned; run it after any change:
//   npx sanity exec scripts/import-privacy.mjs --with-user-token
// Written 3 Nov 2026 for Identity Perth Pty Ltd, aligned with the Australian
// Privacy Principles. Not legal advice: have a lawyer read it before relying on it.
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-01-01'})

let n = 0
const key = () => `b${(n++).toString(36)}`
const span = (text, marks = []) => ({_type: 'span', _key: key(), text, marks})
/** A paragraph from strings and {text, href} links. */
const block = (style, parts, list) => {
  const markDefs = []
  // Parts may arrive as one array or as separate arguments; every string or {text, href} becomes a span.
  const children = [parts].flat(2).map((part) => {
    if (typeof part === 'string') return span(part)
    const def = {_type: 'link', _key: key(), href: part.href}
    markDefs.push(def)
    return span(part.text, [def._key])
  })
  return {_type: 'block', _key: key(), style, markDefs, children, ...(list ? {listItem: list, level: 1} : {})}
}
const h2 = (t) => block('h2', t)
const h3 = (t) => block('h3', t)
const p = (...parts) => block('normal', parts)
const li = (...parts) => block('normal', parts, 'bullet')
const EMAIL = {text: 'hello@identityperth.com', href: 'mailto:hello@identityperth.com'}
const PHONE = {text: '+61 8 6255 8629', href: 'tel:+61862558629'}

const body = [
  p('This policy explains how Identity Perth Pty Ltd collects, holds, uses and discloses personal information, on identityperth.com and in our work with clients.'),
  p('Identity Perth Pty Ltd (ABN 83 647 771 373), trading as Identity Perth (“Identity”, “we”, “us” and “our”), is a creative agency in Joondalup, Western Australia. We handle personal information in line with the Australian Privacy Principles in the Privacy Act 1988 (Cth). This policy was last updated on 3 November 2026.'),

  h2('Scope'),
  h3('1. Who this policy covers'),
  p('This policy applies to everyone whose personal information we handle: visitors to identityperth.com (the “Site”), clients and their staff, suppliers and contractors, people who apply to work with us, and anyone who contacts us.'),
  p('Personal information is information or an opinion about an identified individual, or an individual who is reasonably identifiable, whether or not it is true and whether or not it is recorded in a material form.'),

  h2('What we collect'),
  h3('2. Information you give us'),
  p('When you contact us, work with us or apply for a role, we may collect:'),
  li('your name, organisation, role, email address, phone number and postal address;'),
  li('the content of your emails, calls, messages and meetings with us;'),
  li('details of your brief, your business and your project, and the feedback you give on our work;'),
  li('billing and payment details, such as the name and address for invoices and your ABN;'),
  li('for job and freelance applications: your CV, portfolio, work history, qualifications, referees and your right to work in Australia.'),
  h3('3. Information collected on the Site'),
  p('The Site has no accounts and no forms. When you visit, the tools described in part 4 collect information about your visit automatically:'),
  li('the pages you view, how long you stay, how far you scroll, and what you click, including links to email us or call us, project tiles and links to other sites;'),
  li('how you arrived, such as a search engine, another website or a link in a message;'),
  li('your device and browser type, operating system, screen size and language;'),
  li('an approximate location (city and country) worked out from your network address;'),
  li('a recording of how you moved, scrolled and clicked on a page, and heatmaps built from many visits (see clause 7).'),
  h3('4. Sensitive information'),
  p('We do not ask for sensitive information such as health, ethnic origin, religious beliefs or political opinions, and we ask you not to send it to us unless it is necessary for our work together. If we need it, we will collect it only with your consent.'),

  h2('How we collect it'),
  h3('5. Sources'),
  p('We collect personal information:'),
  li('directly from you, by email, phone, in meetings, through social media and in the course of our work;'),
  li('automatically when you use the Site, through the analytics tools in part 4;'),
  li('from third parties where it is reasonable to do so, such as your organisation, a referee you have named, or publicly available sources like your organisation’s website and LinkedIn.'),
  p('Where it is lawful and practicable, you may deal with us anonymously or under a pseudonym, for example by phoning us with a general enquiry.'),

  h2('Analytics, recordings and cookies'),
  h3('6. Google Analytics'),
  p('We use Google Analytics 4 to understand how the Site is used: which pages are viewed, how visitors arrive, what they click, how far they scroll, and the device, browser and approximate location of a visit. We use this to improve the Site and to see which work people are interested in.'),
  p([
    'The data is sent to Google through Cloudflare Zaraz, which runs on Cloudflare’s network rather than loading Google’s code in your browser. Google Analytics does not log or store your IP address. Google processes the data on our behalf, in the United States and elsewhere, under its ',
    {text: 'privacy policy', href: 'https://policies.google.com/privacy'},
    '; Google explains ',
    {text: 'how it uses information from sites that use its services', href: 'https://policies.google.com/technologies/partner-sites'},
    '. We keep user-level analytics data for no longer than 14 months.',
  ]),
  h3('7. Microsoft Clarity'),
  p([
    'We partner with Microsoft Clarity to capture how you use and interact with the Site through behavioural metrics, heatmaps and session replay, so that we can understand and improve it. Clarity records where you move, scroll and click on a page; the Site has no forms, and Clarity masks any text typed into a page. This usage data is captured using first-party and third-party cookies and other tracking technologies. Microsoft processes the data on our behalf and may also use it as described in the ',
    {text: 'Microsoft Privacy Statement', href: 'https://privacy.microsoft.com/privacystatement'},
    '. We do not use Clarity data for advertising. Microsoft keeps session recordings for 30 days, recordings we label for up to 9 months, and heatmap data for 9 months.',
  ]),
  h3('8. Cloudflare'),
  p([
    'The Site is hosted on Cloudflare, which also serves our videos (Cloudflare Stream) and relays our analytics (Cloudflare Zaraz). Cloudflare processes network addresses and technical details of each request to deliver the Site, keep it secure and measure its performance, including through Cloudflare Web Analytics, which uses no cookies and does not track you across sites. See the ',
    {text: 'Cloudflare privacy policy', href: 'https://www.cloudflare.com/privacypolicy/'},
    '.',
  ]),
  h3('9. Cookies'),
  p('Cookies are small files a website stores in your browser. The Site sets or allows these:'),
  li('cf_zaraz_client, set by the Site for Cloudflare Zaraz, which identifies your browser to our analytics for up to one year;'),
  li('_clck and _clsk, set by the Site for Microsoft Clarity, which identify your browser and your current visit, for up to one year and one day respectively;'),
  li('cookies set by Microsoft on its own domains (clarity.ms and bing.com), such as CLID, MUID, MR, SM, SRM_B and ANONCHK, which Microsoft uses to run Clarity and to recognise your browser across sites that use its services, for up to 13 months.'),
  p('The Site stores nothing else in your browser except the settings of the Site itself, such as your analytics choice below.'),
  h3('10. Your choices'),
  p('You can turn analytics and session recordings off for this Site with the control at the end of this page; your choice is kept in a cookie on this Site for one year. You can also block or delete cookies in your browser’s settings, or use a content blocker. Doing so does not affect your use of the Site.'),

  h2('How we use personal information'),
  h3('11. Purposes'),
  p('We collect, hold and use personal information to:'),
  li('respond to your enquiry and communicate with you;'),
  li('prepare estimates and proposals, deliver our services and manage our relationship with you, including invoicing and payment;'),
  li('consider job and freelance applications and, if successful, engage you;'),
  li('run, secure, measure and improve the Site;'),
  li('keep our business records and comply with our legal and tax obligations;'),
  li('with your permission, show the work we have made for you in our portfolio and marketing.'),
  h3('12. Marketing'),
  p('We may send clients and contacts occasional news about our work. Every message will tell you how to opt out, and you can ask us to stop at any time by emailing ', EMAIL, '. We do not sell personal information and we do not use it for targeted advertising.'),

  h2('Who we share it with'),
  h3('13. Disclosure'),
  p('We share personal information only as needed for the purposes above, with:'),
  li('people within Identity who need it to do their work;'),
  li('service providers who hold or process it for us: Cloudflare (hosting, video and analytics relay), Sanity (our content management system), Google (analytics, email and documents), Microsoft (Clarity), and our accounting, invoicing and payment providers;'),
  li('contractors and collaborators we engage on your project, such as photographers, printers and developers, under confidentiality obligations;'),
  li('our professional advisers, such as accountants, lawyers and insurers;'),
  li('a buyer or successor if our business is sold or restructured, who will be bound by this policy;'),
  li('courts, regulators and law enforcement where the law requires or permits it.'),
  h3('14. Overseas disclosure'),
  p('Some of these providers store or process information outside Australia, mainly in the United States and the European Union, including Google, Microsoft, Cloudflare and Sanity. Before we use a provider we check that it protects personal information in a way that is substantially similar to the Australian Privacy Principles, and we rely on contractual terms with it.'),

  h2('Security and retention'),
  h3('15. Security'),
  p('We take reasonable steps to protect personal information from misuse, loss and unauthorised access: the Site is served over HTTPS, access to our systems is limited to the people who need it, and our providers are established companies with their own security programs. No method of storage or transmission is completely secure, and we cannot guarantee that information will never be accessed without authority. If a data breach is likely to result in serious harm to you, we will notify you and the Office of the Australian Information Commissioner as the law requires.'),
  h3('16. How long we keep it'),
  p('We keep personal information for as long as we need it for the purposes above, or as long as the law requires, then delete or de-identify it. Analytics data is kept for the periods in part 4.'),

  h2('Your rights'),
  h3('17. Access and correction'),
  p('You can ask us for a copy of the personal information we hold about you, and ask us to correct anything that is inaccurate, out of date, incomplete or misleading. Email ', EMAIL, '. We will respond within a reasonable time, and we may need to confirm your identity first. We do not charge for a request, though we may charge a reasonable fee for the cost of supplying copies. If we refuse a request, we will tell you why in writing and how you can complain.'),
  h3('18. Children'),
  p('The Site is not directed at children under 16 and we do not knowingly collect their personal information. If you believe a child has given us information, contact us and we will delete it.'),
  h3('19. Complaints'),
  p([
    'If you are concerned about how we have handled your personal information, email ', EMAIL, ' with the details and we will investigate and reply within a reasonable time. If you are not satisfied with our response, you can complain to the Office of the Australian Information Commissioner at ',
    {text: 'oaic.gov.au', href: 'https://www.oaic.gov.au/'},
    ' or on 1300 363 992.',
  ]),

  h2('Other matters'),
  h3('20. Other websites'),
  p('The Site links to other websites and to our social media profiles. Those sites and platforms have their own privacy policies, which govern any information you give them; we are not responsible for how they handle it.'),
  h3('21. Changes to this policy'),
  p('We may update this policy from time to time, for example when we change the tools we use. The current version is always at identityperth.com/privacy, with the date it was last updated at the top. Continuing to use the Site after a change means the updated policy applies to your visit.'),
  h3('22. Contact us'),
  p('Identity Perth Pty Ltd, 5/15 Vanden Way, Joondalup WA 6027, Australia. Email ', EMAIL, ' or call ', PHONE, '.'),
]

// Legal pages show list items without markers (global.css, .prose-legal): like the Terms, each item carries
// its own letter, (a), (b) and so on, restarting with every list.
let letter = 0
for (let i = 0; i < body.length; i++) {
  const b = body[i]
  if (!b.listItem) {
    letter = 0
    continue
  }
  b.children[0].text = `(${String.fromCharCode(97 + letter++)}) ${b.children[0].text}`
}

const rank = await client.fetch(`*[_id=="legal-privacy"][0].orderRank`)
  ?? (await client.fetch(`*[_type=="legalPage" && !(_id in path("drafts.**"))]|order(orderRank desc)[0].orderRank`))?.replace(/:$/, '1:')
await client.createOrReplace({
  _id: 'legal-privacy',
  _type: 'legalPage',
  orderRank: rank ?? '0|hzzzzz:',
  title: 'Privacy Policy',
  slug: {_type: 'slug', current: 'privacy'},
  body,
})
console.log(`Privacy Policy written: ${body.length} blocks, ${body.filter((b) => b.style === 'h2').length} parts, ${body.filter((b) => b.style === 'h3').length} clauses`)
