import assert from 'node:assert/strict';
import test from 'node:test';
import { getSeoPage, renderSeoContent, SEO_PAGES } from '../src/seoPages.js';

test('each tool has a unique crawlable route and page title', () => {
  const routes = SEO_PAGES.map(({ route }) => route);
  const titles = SEO_PAGES.map(({ title }) => title);
  assert.equal(new Set(routes).size, routes.length);
  assert.equal(new Set(titles).size, titles.length);
  for (const page of SEO_PAGES) {
    assert.ok(page.title.length > 10);
    assert.ok(page.description.length > 50);
    assert.match(renderSeoContent(page), /<h1 id="seo-heading">/);
    assert.match(renderSeoContent(page), /How to use this tool/);
  }
});

test('maps direct tool routes and falls back to the home page', () => {
  assert.equal(getSeoPage('/yaml-formatter').format, 'yaml');
  assert.equal(getSeoPage('/jwt-debugger/').toolMode, 'jwtDecode');
  assert.equal(getSeoPage('/unknown/').route, '/');
});

test('escapes page copy before rendering static markup', () => {
  const html = renderSeoContent({
    ...SEO_PAGES[0],
    heading: '<script>alert("unsafe")</script>',
    intro: 'A & B',
    steps: ['<img src=x onerror=alert(1)>'],
    features: [],
  });
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt;/);
  assert.match(html, /A &amp; B/);
});
