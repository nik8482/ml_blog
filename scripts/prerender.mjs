// Post-build step: generate a static HTML file per post (dist/<slug>/index.html)
// with per-post Open Graph / Twitter meta tags baked in, so crawlers that don't
// run JS (LinkedIn, Twitter, etc.) show the right title/description/thumbnail.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'dist');
const meta = JSON.parse(readFileSync(join(here, 'posts.meta.json'), 'utf8'));

const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf8');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tagsFor = ({ title, description, url, image }) => `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${esc(meta.siteName)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />`;

// Remove the home/default head tags so per-post tags don't collide with them.
const stripHeadTags = (html) =>
  html
    .replace(/\s*<title>[^<]*<\/title>/i, '')
    .replace(/\s*<meta\s+name="description"[^>]*>/gi, '')
    .replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/\s*<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '');

// Inject the per-post tags just before </head>.
const buildHtml = (tags) =>
  stripHeadTags(baseHtml).replace('</head>', `${tags}\n  </head>`);

for (const post of meta.posts) {
  const url = `${meta.siteUrl}/${post.slug}`;
  const image = `${meta.siteUrl}${post.image}`;
  const html = buildHtml(tagsFor({ title: post.title, description: post.description, url, image }));
  const outDir = join(distDir, post.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
  console.log(`prerendered /${post.slug}`);
}

console.log(`prerender: wrote ${meta.posts.length} post page(s)`);
