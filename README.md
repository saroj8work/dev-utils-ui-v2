# Format Studio

Format Studio is a browser-based developer toolkit for formatting and previewing JSON, HTML, XML, YAML, and Markdown, and for decoding JWTs and encoding or decoding Base64 URL-safe text.

All tools run in the browser. No backend service or API configuration is required, and input is not sent to a server by the app.

## Features

- Format JSON, HTML, XML, YAML, and Markdown; preview HTML and Markdown in an isolated frame.
- Open local `.json`, `.html`, `.htm`, `.xml`, `.yaml`, `.yml`, `.md`, or `.markdown` files.
- Browse JSON and XML results in a collapsible tree.
- Decode and sign JWTs locally; verify HMAC, RSA, RSA-PSS, ECDSA, and EdDSA signatures using text secrets, Base64URL secrets, PEM keys, JWKs, or local JWKS documents.
- Inspect registered JWT claims and optionally check expected issuer and audience values. Decoding alone does not verify signatures or make claims trustworthy.
- Encode and decode UTF-8 text using unpadded Base64 URL-safe encoding.
- Copy results, download output, and process inputs up to 1 MiB.
- While focused in the editor, press `Ctrl/⌘+Enter` to process input or `Ctrl/⌘+Shift+X` to clear the input and result.
- Switch between light and dark appearance; the selected theme is remembered in this browser.

JWT keys and tokens are held only in app memory and are not sent to a server or saved by the app. Signature verification does not automatically validate application-specific claims; use the Claims breakdown and set expected issuer and audience values where appropriate. Browser cryptography support can vary by algorithm.

## Run locally

Install Node.js LTS, then run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. Build and preview the production app with:

```powershell
npm run build
npm run preview
```

Run the local processing regression tests with:

```powershell
npm test
```
