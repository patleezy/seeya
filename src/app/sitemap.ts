import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://seeyasoon.digital', changeFrequency: 'monthly', priority: 1 },
    { url: 'https://seeyasoon.digital/privacy', changeFrequency: 'yearly', priority: 0.3 },
  ];
}
