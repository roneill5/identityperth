/**
 * Real copy from the Identity Capability Statement (8 Oct 2026) and the
 * Internal Brand Snapshot (9 Oct 2026). Used by seed-from-v1.mjs so the
 * seeded site reads as Identity, not as placeholder text.
 */

export const SERVICES = [
	['Insight & Strategy', 'Research, discovery, workshops, brand audits, positioning, naming, architecture, messaging and strategic direction.'],
	['Brand & Identity', 'Verbal and visual identity, brand systems, guidelines, tone of voice, identity development and implementation.'],
	['Campaigns & Comms', 'Creative concepts, campaigns, advertising, outdoor, publications, property marketing, EDMs and strategic communications.'],
	['Digital & Web', 'Website strategy, UX, UI, design, development, digital platforms, integrations, maintenance and ongoing optimisation.'],
	['Content & Production', 'Copywriting, social content, graphic design, artwork, photography direction, animation, video, print and fabrication management.'],
	['Guidance & Growth', 'Ongoing strategic guidance, rollout, brand management, measurement, optimisation and continuous improvement.'],
];

export const TEAM = [
	['Nick Littlemore', 'Founder & Creative Director', 'Nick began his career in London and has spent more than 30 years working with organisations to build, sharpen and evolve brands. He combines creative instinct with deep experience and a belief that the quality of the answer depends on the quality of the questions asked first.'],
	['Belinda Littlemore', 'Director, Strategy & Marketing', 'With more than 25 years of experience across marketing, tourism, aviation and hospitality in Australia and the UK, Bel brings commercial perspective, strategic clarity and a strong understanding of how brands connect with people, markets and opportunity.'],
	['Seth Carter', 'Brand & Creative Lead', 'Seth brings strategic thinking and creative direction together with strong design craft. His considered approach helps organisations navigate change, clarify how they should present themselves and translate strategy into distinctive brand experiences.'],
	['Ross O’Neill', 'Web & Tech Lead', 'Ross combines front-end design understanding with back-end development capability to create digital experiences that perform as well as they look. His approach is practical, considered and focused on solving the wider business requirement rather than simply building pages.'],
	['Eilidh Pilkington', 'Digital, Social & Design', 'Eilidh works across social media, digital marketing, design and content. With an audience-first mindset and an understanding of how people behave online, she helps brands turn strategy into relevant, engaging and measurable digital communication.'],
	['Jake Quodling', 'Design, Animation & Video', 'Jake is a multidisciplinary designer working across branding, campaigns, animation, content and digital. He combines strong visual craft with practical marketing thinking to create work designed to attract attention and communicate clearly.'],
];

export const TESTIMONIALS = [
	{
		client: 'Bromley Real Estate',
		name: 'Roberta Armstrong',
		role: 'Head of People, Marketing & PR',
		quote: 'What I value most is that they really understand us and the property market we operate in. They’ve helped us launch a new business, sharpen how we present ourselves and communicate more clearly with the market. We also love how easy they are to work with, and how they can take the seed of an idea and turn it into something far stronger.',
	},
	{
		client: 'Liquid Mix',
		name: 'Ben Murphy',
		role: 'Sales & Marketing',
		quote: 'There’s always plenty happening in our world, often at short notice. The team makes it easy. They understand the pace, bring fresh ideas and somehow manage to turn even the roughest brief into something polished, creative and ready to go.',
	},
	{
		client: 'Amana Living',
		name: 'Gillian Reilly',
		role: 'Head of Marketing',
		quote: 'They genuinely care about getting it right. Our communications often need warmth, clarity and sensitivity, and the team understands that instinctively. They’re thoughtful, responsive and incredibly easy to work with.',
	},
];

/** The logo wall from the Capability Statement. */
export const CLIENT_WALL = [
	'Tourism Western Australia', 'Amana Living', 'RMW Hospitality Group', 'Lion', 'Raintree', 'The DAM',
	'COMO The Treasury', 'State Buildings', 'FJM Property', 'Four Pillars', 'City of Wanneroo', 'Hotel Rottnest',
	'Parmelia Hilton', 'JPR Property', 'The Marina Mindarie', 'Range Commercial', 'Margaret River Busselton Tourism Association',
	'Panhead Brewery', 'Liquid Mix', 'Powerplay', 'James Squire', 'Bromley Real Estate', 'Tilt Commercial', 'Element Construction',
	'Indian Ocean Brewing Company', 'Southpeak', 'Kirin', 'The Boat', 'White Claw', 'Horizon Residences', 'XXXX', 'The Breakwater',
];

/** v1 project client names that should map onto a logo-wall client. */
export const CLIENT_ALIASES = {
	'Bromley': 'Bromley Real Estate',
	'Bromley RE': 'Bromley Real Estate',
	'The DAM Restaurant': 'The DAM',
	'Horizon Residence': 'Horizon Residences',
	'Horizon Brands': 'Horizon Residences',
	'Indian Ocean Brewing': 'Indian Ocean Brewing Company',
	'Indian Ocean Brewing Co.': 'Indian Ocean Brewing Company',
	'IOBC': 'Indian Ocean Brewing Company',
	'JPR': 'JPR Property',
	'MRBTA': 'Margaret River Busselton Tourism Association',
	'Margaret River Busselton Tourism': 'Margaret River Busselton Tourism Association',
	'Tourism WA': 'Tourism Western Australia',
	'Range': 'Range Commercial',
	'Liquid Mix WA': 'Liquid Mix',
	'Four Pillars Gin': 'Four Pillars',
};

export const DIFFERENCE = [
	['We start with better questions.', 'We look beyond the brief to understand the real problem.'],
	['We think collectively.', 'Different disciplines, perspectives and decades of experience strengthen our thinking.'],
	['The people you meet do the thinking.', 'Our senior team stays close to the work, sharing context and responsibility.'],
	['The thinking stays connected.', 'Strategy, creative, digital and implementation are developed together.'],
	['We stay involved.', 'The better we understand the organisation, the more valuable our contribution becomes.'],
	['We finish properly.', 'Ideas create value when they are carried through with consistency, craft and accountability.'],
];

export const WHAT_CHANGES = [
	['Clearer decisions', 'A stronger direction makes it easier to know what fits.'],
	['Better continuity', 'Ideas stay connected across channels, projects and implementation.'],
	['Less friction', 'Fewer handovers, less re-explaining and fewer disconnected suppliers.'],
	['Greater confidence', 'Leadership, marketing and sales teams have clearer tools and language.'],
	['More capability', 'Internal teams gain specialist expertise without having to build it all in-house.'],
	['Stronger recognition', 'Consistency makes the organisation easier to understand and remember.'],
];

export const PROCESS = [
	['Insight', 'Understand the business. Challenge assumptions. Find the real opportunity.'],
	['Strategy', 'Clarify the direction. Define the position. Create alignment.'],
	['Identity', 'Build the character, voice, visual language and behaviours that make the organisation unmistakably itself.'],
	['Expression', 'Bring the idea to life through purposeful communications, experiences and every relevant touchpoint.'],
	['Execution', 'Deliver every detail with consistency, control, craftsmanship and clear accountability.'],
	['Evolution', 'Learn, optimise, protect consistency and strengthen the identity over time.'],
];

export const COPY = {
	hook: 'Without Identity, who are you?',
	positioning: 'We’re the people organisations call when the brand matters.',
	tagline: 'Great branding isn’t magic, it’s method.',
	menuText: 'If you’re ready to build a brand that means something, we’re ready to help make it real.',
	clearerHeading: 'A clearer Identity.',
	clearerBody:
		'Founded in Perth, Western Australia in 2009, Identity is a strategic and creative partner working with organisations that care about how they are understood, experienced and remembered. We connect senior thinking with practical execution, helping organisations make better decisions, communicate with greater clarity and carry strong ideas consistently across every touchpoint.',
	philosophy: 'Identity builds Perception.\nPerception builds Trust.\nTrust builds Value.',
	capabilityIntro: 'Not because every client needs everything. But a problem rarely needs one discipline.',
	changesIntro: 'The output is only part of the value. Clients may come to Identity for a brand, website, campaign or piece of communication. What the relationship creates is broader.',
	processIntro: 'The process adapts to the problem. Not every engagement needs every stage, but every engagement begins with understanding what actually needs to change.',
	teamIntro: 'The people you meet do the thinking. Our senior team stays close to the work, sharing context and responsibility.',
	clientsHeading: 'Together, we make it happen.',
	ctaHeading: 'Make it impossible to ignore.',
	aboutHeading: 'Connected capability.',
	aboutBody: [
		'Identity is deliberately built as a connected strategic and creative partner.',
		'Strategy, brand, campaigns, content, digital, websites, social, print, signage, motion and ongoing implementation sit within one team.',
		'That means fewer disconnected handovers, less time protecting the original idea and greater consistency from the first conversation to the final execution.',
	],
	aboutHighlights: ['The relationship stays close.', 'The thinking stays connected.', 'The accountability stays with us.'],
	ticker: ['Thinking made real.', 'Connected capability.', 'Creative partners.'],
	seoDescription:
		'Identity is a strategic and creative partner in Perth, Western Australia. Strategy, brand, campaigns, content, digital and websites from one connected team.',
};
