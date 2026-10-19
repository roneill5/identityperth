import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { client } from './client';

const builder = createImageUrlBuilder(client);

/**
 * Sanity image URL builder. Always request the size you need, e.g.
 * `urlFor(image).width(1200).url()`. Hotspot and crop data on the image are
 * applied automatically when `.fit('crop')` is used with a width and height.
 */
export function urlFor(source: SanityImageSource) {
	return builder.image(source).auto('format');
}
