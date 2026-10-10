export const SEO_PAGES = [
  {
    slug: '',
    route: '/',
    title: 'Free Online Developer Tools | Format Studio',
    heading: 'Free Online Developer Tools',
    description: 'Format JSON, HTML, XML, YAML, and Markdown, debug JWTs, and use Base64URL tools in your browser.',
    intro: 'Format Studio brings common developer utilities together in one browser-based workspace. Format structured documents, inspect JWTs, and convert Base64URL text without uploading your input.',
    sectionTitle: 'Tools for everyday development',
    details: 'Choose a formatter to clean up JSON, HTML, XML, YAML, or Markdown. The JWT debugger decodes tokens and can sign or verify supported algorithms locally. Base64URL tools encode and decode UTF-8 text.',
    steps: ['Choose a tool from the navigation.', 'Paste text or open a supported local document.', 'Run the tool, then copy or download the result.'],
    features: ['JSON and XML tree views', 'HTML and Markdown previews in a sandbox', 'JWT signing, verification, and registered-claim checks', 'Light and dark themes'],
  },
  {
    slug: 'json-formatter',
    route: '/json-formatter/',
    format: 'json',
    title: 'JSON Formatter Online | Format Studio',
    heading: 'Free Online JSON Formatter',
    description: 'Format and beautify JSON online in your browser. Inspect nested data in a tree view and copy or download the formatted result.',
    intro: 'Make minified or hard-to-read JSON easier to inspect. This free JSON formatter parses and pretty-prints your input locally, then lets you browse nested objects and arrays in a collapsible tree.',
    sectionTitle: 'Format and inspect JSON',
    details: 'Paste JSON into the editor and format it with consistent two-space indentation. The tree view makes nested values easier to explore, while Source shows the formatted JSON you can copy or download.',
    steps: ['Paste JSON or open a local .json file.', 'Choose Format document or press Ctrl/⌘+Enter in the editor.', 'Review the tree or source, then copy or download the result.'],
    features: ['Readable two-space indentation', 'Collapsible nested object and array tree', 'Clear parser errors for invalid JSON', 'Local processing with no upload'],
  },
  {
    slug: 'jwt-debugger',
    route: '/jwt-debugger/',
    toolMode: 'jwtDecode',
    title: 'JWT Debugger Online | Decode and Verify JWTs',
    heading: 'JWT Debugger',
    description: 'Decode JWT headers and payloads, inspect registered claims, and locally verify or sign supported JWS algorithms.',
    intro: 'Inspect a three-part signed JSON Web Token (JWS) in your browser. Decode its header and payload, review registered claims, and optionally verify its signature with a key you provide.',
    sectionTitle: 'Decode and verify JSON Web Tokens',
    details: 'The debugger supports HMAC, RSA, RSA-PSS, ECDSA, and EdDSA algorithms, plus local PEM, JWK, and JWKS keys. You can also sign a JSON payload locally. Decoding does not verify a signature, and signature verification alone is not an authorization policy.',
    steps: ['Paste a three-part JWT into Decode / verify mode.', 'Optionally provide the matching verification key and expected issuer or audience.', 'Review the signature status and Claims breakdown; do not trust claims unless required checks pass.'],
    features: ['Local decode, signing, and signature verification', 'Registered-claim checks for exp, nbf, iat, iss, and aud', 'Text or Base64URL HMAC secrets, PEM, JWK, and local JWKS', 'Tokens and keys are not sent to a server'],
  },
  {
    slug: 'html-formatter',
    route: '/html-formatter/',
    format: 'html',
    title: 'HTML Formatter Online | Format Studio',
    heading: 'Free Online HTML Formatter',
    description: 'Beautify HTML online with readable indentation, then inspect the source or preview the markup in an isolated browser frame.',
    intro: 'Clean up compact or inconsistently indented HTML in your browser. Review the formatted source and render a sandboxed preview without sending your markup to a server.',
    sectionTitle: 'Format and preview HTML',
    details: 'The formatter applies consistent indentation to HTML documents. Switch between the source and an isolated preview to inspect how markup renders.',
    steps: ['Paste HTML or open a local .html or .htm file.', 'Format the document.', 'Review Source or Preview, then copy or download the output.'],
    features: ['Readable HTML indentation', 'Sandboxed preview with scripts and external resources blocked', 'Copy or download the formatted source', 'Local browser processing'],
  },
  {
    slug: 'xml-formatter',
    route: '/xml-formatter/',
    format: 'xml',
    title: 'XML Formatter Online | Format Studio',
    heading: 'Free Online XML Formatter',
    description: 'Format and beautify XML online, browse elements in a collapsible tree, and copy or download the result.',
    intro: 'Make XML documents easier to read and inspect. Format XML with consistent indentation, then explore its elements in a tree view or review the source.',
    sectionTitle: 'Format and inspect XML',
    details: 'The XML formatter parses your document locally and lays out nested elements with readable indentation. Use the tree to expand or collapse branches.',
    steps: ['Paste XML or open a local .xml file.', 'Format the document.', 'Browse the tree or switch to Source, then copy or download the result.'],
    features: ['Consistent XML indentation', 'Collapsible element tree', 'Parser feedback for malformed XML', 'No server upload'],
  },
  {
    slug: 'markdown-formatter',
    route: '/markdown-formatter/',
    format: 'markdown',
    title: 'Markdown Formatter and Preview | Format Studio',
    heading: 'Free Online Markdown Formatter',
    description: 'Format Markdown, preview its rendered output in an isolated frame, and copy or download your document.',
    intro: 'Tidy up Markdown and check its rendered appearance in one browser-based tool. Your document stays in the browser while you switch between formatted source and preview.',
    sectionTitle: 'Format and preview Markdown',
    details: 'The formatter normalizes Markdown layout and provides a rendered preview in a sandboxed frame. Copy the source or download the formatted document.',
    steps: ['Paste Markdown or open a local .md or .markdown file.', 'Format the document.', 'Switch between Source and Preview, then copy or download the result.'],
    features: ['Readable Markdown source', 'Rendered preview in an isolated frame', 'Open .md and .markdown files', 'Local processing'],
  },
  {
    slug: 'yaml-formatter',
    route: '/yaml-formatter/',
    format: 'yaml',
    title: 'YAML Formatter Online | Format Studio',
    heading: 'Free Online YAML Formatter',
    description: 'Format YAML online with readable indentation. Open YAML or YML files, then copy or download the formatted result.',
    intro: 'Improve the readability of YAML configuration and data files with consistent formatting. This browser-based formatter also opens both .yaml and .yml files.',
    sectionTitle: 'Format YAML and YML files',
    details: 'Paste YAML or load a local file to format it with consistent indentation. Review the output before copying it or downloading the formatted document.',
    steps: ['Paste YAML or open a local .yaml or .yml file.', 'Format the document.', 'Review, copy, or download the formatted YAML.'],
    features: ['Supports .yaml and .yml files', 'Consistent two-space indentation', 'Clear feedback for invalid YAML', 'No upload required'],
  },
  {
    slug: 'base64url-encoder',
    route: '/base64url-encoder/',
    toolMode: 'base64Encode',
    title: 'Base64URL Encoder Online | Format Studio',
    heading: 'Base64URL Encoder',
    description: 'Encode UTF-8 text as unpadded Base64URL online in your browser, then copy or download the result.',
    intro: 'Convert plain text to URL-safe Base64 using the RFC 4648 URL-safe alphabet. Encoding runs locally and returns unpadded Base64URL text.',
    sectionTitle: 'Encode text as Base64URL',
    details: 'Enter UTF-8 text to encode it with the URL-safe Base64 alphabet, which uses hyphens and underscores instead of plus and slash and omits trailing padding.',
    steps: ['Enter or paste UTF-8 text.', 'Run Base64 encode.', 'Copy the encoded value or download it as a text file.'],
    features: ['URL-safe Base64 alphabet', 'Unpadded output', 'UTF-8 text support', 'Local browser processing'],
  },
  {
    slug: 'base64url-decoder',
    route: '/base64url-decoder/',
    toolMode: 'base64Decode',
    title: 'Base64URL Decoder Online | Format Studio',
    heading: 'Base64URL Decoder',
    description: 'Decode URL-safe Base64 text to UTF-8 online in your browser, with clear errors for malformed data.',
    intro: 'Convert Base64URL text back to readable UTF-8 text. The decoder accepts valid padded or unpadded URL-safe input and reports malformed or invalid UTF-8 data.',
    sectionTitle: 'Decode Base64URL text',
    details: 'Paste a Base64URL value using letters, digits, hyphens, underscores, and optional valid padding. Decoded data must be valid UTF-8 text.',
    steps: ['Paste Base64URL text.', 'Run Base64 decode.', 'Review, copy, or download the decoded text.'],
    features: ['Accepts padded or unpadded Base64URL', 'Validates UTF-8 output', 'Clear malformed-input errors', 'Local browser processing'],
  },
];

export function getSeoPage(pathname) {
  const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return SEO_PAGES.find((page) => page.route === normalizedPath) || SEO_PAGES[0];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function renderSeoContent(page) {
  const links = SEO_PAGES
    .filter((relatedPage) => relatedPage.slug !== page.slug && relatedPage.slug)
    .map((relatedPage) => `<li><a href="${escapeHtml(relatedPage.route)}">${escapeHtml(relatedPage.heading)}</a></li>`)
    .join('');
  return `<section class="seo-content" aria-labelledby="seo-heading">
    <h1 id="seo-heading">${escapeHtml(page.heading)}</h1>
    <p class="seo-intro">${escapeHtml(page.intro)}</p>
    <h2>${escapeHtml(page.sectionTitle)}</h2>
    <p>${escapeHtml(page.details)}</p>
    <h2>How to use this tool</h2>
    <ol>${page.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
    <h2>Features</h2>
    <ul>${page.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>
    <p class="seo-privacy">Input is processed in your browser and is not uploaded by this tool.</p>
    ${page.toolMode === 'jwtDecode' ? '<p class="seo-privacy">JWT decoding does not verify a signature. Only rely on claims after the signature and your application-specific requirements have been checked.</p>' : ''}
    <nav aria-label="Related tools"><h2>Related tools</h2><ul>${links}</ul></nav>
  </section>`;
}
