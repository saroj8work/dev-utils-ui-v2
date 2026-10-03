import assert from 'node:assert/strict';
import test from 'node:test';
import { processLocally } from '../src/localTools.js';

test('formats supported document types locally', async (t) => {
  const cases = [
    ['json', '{"name":"Ada","active":true}', '"name": "Ada"'],
    ['html', '<main><h1>Hello</h1></main>', '<main>'],
    ['xml', '<root><item>value</item></root>', '<root>'],
    ['markdown', '# Hello\n\nA paragraph.', '# Hello'],
    ['yaml', 'name: Ada\nroles:\n  - admin\n  - editor', 'name: Ada'],
  ];

  for (const [format, content, expected] of cases) {
    await t.test(format, async () => {
      const result = await processLocally({ toolMode: 'format', format, content });
      assert.match(result.formattedContent, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.equal(result.characterCount, content.length);
      assert.ok(result.fileName.endsWith(format === 'markdown' ? '.md' : `.${format}`));
      if (format === 'markdown') assert.match(result.previewHtml, /<h1>Hello<\/h1>/);
    });
  }
});

test('reports invalid JSON as a formatting error', async () => {
  await assert.rejects(
    processLocally({ toolMode: 'format', format: 'json', content: '{"unfinished":' }),
  );
});

test('encodes and decodes UTF-8 as unpadded Base64URL', async () => {
  const content = 'Hello, 世界 🌍';
  const encoded = await processLocally({ toolMode: 'base64Encode', content });
  assert.match(encoded.formattedContent, /^[A-Za-z0-9_-]+$/);
  const decoded = await processLocally({ toolMode: 'base64Decode', content: encoded.formattedContent });
  assert.equal(decoded.formattedContent, content);
});

test('rejects malformed Base64URL and non-UTF-8 decoded data', async (t) => {
  await t.test('malformed input', async () => {
    await assert.rejects(
      processLocally({ toolMode: 'base64Decode', content: 'not+base64' }),
      /valid Base64 URL-safe text/,
    );
  });
  await t.test('invalid UTF-8', async () => {
    await assert.rejects(
      processLocally({ toolMode: 'base64Decode', content: '_w' }),
      /valid UTF-8 text/,
    );
  });
});

test('signs and verifies an HS256 JWT, checks expected claims, and rejects a mismatched key', async () => {
  const key = 'test-secret-that-is-at-least-32-bytes-long';
  const payload = JSON.stringify({ sub: 'user-123', role: 'reader', iss: 'https://issuer.example', aud: ['web', 'mobile'] });
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const signed = await processLocally({
    toolMode: 'jwtDecode',
    jwtAction: 'encode',
    content: payload,
    jwtHeader: header,
    jwtKey: key,
  });

  assert.equal(signed.jwtInfo.verification.status, 'signed');
  const verified = await processLocally({
    toolMode: 'jwtDecode',
    jwtAction: 'decode',
    content: signed.formattedContent,
    jwtKey: key,
    jwtOptions: { expectedIssuer: 'https://issuer.example', expectedAudience: 'web' },
  });
  assert.equal(verified.jwtInfo.verification.status, 'valid');
  assert.equal(verified.jwtInfo.payload.sub, 'user-123');
  assert.equal(verified.jwtInfo.claimChecks.find(({ name }) => name === 'iss').status, 'valid');
  assert.equal(verified.jwtInfo.claimChecks.find(({ name }) => name === 'aud').status, 'valid');

  const rejected = await processLocally({
    toolMode: 'jwtDecode',
    jwtAction: 'decode',
    content: signed.formattedContent,
    jwtKey: 'a-different-secret-that-is-at-least-32-bytes',
  });
  assert.equal(rejected.jwtInfo.verification.status, 'invalid');
});

test('reports malformed JWT structure', async () => {
  await assert.rejects(
    processLocally({ toolMode: 'jwtDecode', jwtAction: 'decode', content: 'not.a.jwt' }),
    /valid Base64 URL-safe text|Could not decode the JWT/,
  );
});
