function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(value)) {
    throw new Error('Enter valid Base64 URL-safe text.');
  }

  const unpadded = value.replace(/=+$/, '');
  const paddingLength = value.length - unpadded.length;
  if (
    unpadded.length % 4 === 1
    || (paddingLength > 0 && (
      value.length % 4 !== 0
      || (paddingLength === 1 && unpadded.length % 4 !== 3)
      || (paddingLength === 2 && unpadded.length % 4 !== 2)
    ))
  ) {
    throw new Error('Enter valid Base64 URL-safe text.');
  }

  const base64 = unpadded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  let binary;
  try {
    binary = atob(padded);
  } catch {
    throw new Error('Enter valid Base64 URL-safe text.');
  }

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('The Base64 data does not contain valid UTF-8 text.');
  }
}

function decodeBase64UrlBytes(value) {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(value)) {
    throw new Error('Enter valid Base64 URL-safe text.');
  }

  const unpadded = value.replace(/=+$/, '');
  const paddingLength = value.length - unpadded.length;
  if (
    unpadded.length % 4 === 1
    || (paddingLength > 0 && (
      value.length % 4 !== 0
      || (paddingLength === 1 && unpadded.length % 4 !== 3)
      || (paddingLength === 2 && unpadded.length % 4 !== 2)
    ))
  ) {
    throw new Error('Enter valid Base64 URL-safe text.');
  }

  const base64 = unpadded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  let binary;
  try {
    binary = atob(padded);
  } catch {
    throw new Error('Enter valid Base64 URL-safe text.');
  }

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('A JWT must contain three dot-separated parts.');
  }

  let header;
  let payload;
  try {
    header = JSON.parse(decodeBase64Url(parts[0]));
    if (header === null || typeof header !== 'object' || Array.isArray(header)) {
      throw new Error('The JWT header must be a JSON object.');
    }
  } catch (error) {
    throw new Error(`Could not decode the JWT header: ${error.message}`);
  }
  try {
    payload = JSON.parse(decodeBase64Url(parts[1]));
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('The JWT payload must be a JSON object.');
    }
  } catch (error) {
    throw new Error(`Could not decode the JWT payload: ${error.message}`);
  }
  decodeBase64UrlBytes(parts[2]);

  return {
    header,
    payload,
    signature: parts[2],
  };
}

async function importJwtKey(keyText, algorithm, { signing, base64UrlSecret, keyId }) {
  const { importJWK, importPKCS8, importSPKI, importX509 } = await import('jose');
  let jwk;
  try {
    jwk = JSON.parse(keyText);
  } catch {
    jwk = null;
  }
  if (!jwk && /^[\[{]/.test(keyText.trim())) {
    throw new Error('The key looks like JSON but is not a valid JWK or JWKS object.');
  }
  if (Array.isArray(jwk)) {
    throw new Error('Enter a JWK object or a JWKS object with a keys array.');
  }

  if (jwk && Array.isArray(jwk.keys)) {
    const candidates = jwk.keys.filter((entry) => (
      entry
      && typeof entry === 'object'
      && (!entry.alg || entry.alg === algorithm)
      && (!entry.use || entry.use === 'sig')
      && (!entry.key_ops || entry.key_ops.includes(signing ? 'sign' : 'verify'))
    ));
    jwk = keyId
      ? candidates.find((entry) => entry.kid === keyId)
      : candidates.length === 1 ? candidates[0] : null;
    if (!jwk) {
      throw new Error(keyId
        ? `No signing key in this JWKS matches kid "${keyId}" and ${algorithm}.`
        : 'This JWKS must contain exactly one compatible key, or the JWT header must include a matching kid.');
    }
  }

  if (jwk && typeof jwk === 'object' && !Array.isArray(jwk)) {
    return importJWK(jwk, algorithm);
  }

  if (algorithm.startsWith('HS')) {
    return base64UrlSecret
      ? decodeBase64UrlBytes(keyText)
      : new TextEncoder().encode(keyText);
  }

  const pem = keyText.trim();
  if (pem.includes('-----BEGIN CERTIFICATE-----')) {
    if (signing) throw new Error('A certificate contains a public key and cannot sign a JWT.');
    return importX509(pem, algorithm);
  }
  if (pem.includes('-----BEGIN PUBLIC KEY-----')) {
    if (signing) throw new Error('Use a private key to sign a JWT.');
    return importSPKI(pem, algorithm);
  }
  if (pem.includes('-----BEGIN PRIVATE KEY-----')) {
    if (!signing) throw new Error('Use a public key to verify a JWT.');
    return importPKCS8(pem, algorithm);
  }

  throw new Error('Enter an octet/JWK key or a supported PEM key. HMAC algorithms use a text secret by default.');
}

function getClaimChecks(payload, expectedIssuer, expectedAudience) {
  const now = Math.floor(Date.now() / 1000);
  const checks = [];
  const addTimeClaim = (name, label, valid, invalidMessage) => {
    if (name in payload) {
      const value = payload[name];
      const validNumber = typeof value === 'number' && Number.isFinite(value);
      checks.push({
        name,
        label,
        value,
        status: validNumber ? (valid(value) ? 'valid' : 'invalid') : 'invalid',
        message: validNumber ? (valid(value) ? 'Valid' : invalidMessage) : 'Expected a NumericDate (number of seconds).',
      });
    }
  };

  addTimeClaim('exp', 'Expires', (value) => value > now, 'Token has expired.');
  addTimeClaim('nbf', 'Not before', (value) => value <= now, 'Token is not active yet.');
  addTimeClaim('iat', 'Issued at', (value) => value <= now, 'Issued-at time is in the future.');

  if ('iss' in payload) {
    const matches = !expectedIssuer || payload.iss === expectedIssuer;
    checks.push({
      name: 'iss',
      label: 'Issuer',
      value: payload.iss,
      status: expectedIssuer ? (matches ? 'valid' : 'invalid') : 'not-checked',
      message: expectedIssuer ? (matches ? 'Matches expected issuer.' : 'Does not match expected issuer.') : 'Set an expected issuer to validate.',
    });
  } else if (expectedIssuer) {
    checks.push({ name: 'iss', label: 'Issuer', value: undefined, status: 'invalid', message: 'Issuer claim is missing.' });
  }

  if ('aud' in payload) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const matches = !expectedAudience || audiences.includes(expectedAudience);
    checks.push({
      name: 'aud',
      label: 'Audience',
      value: payload.aud,
      status: expectedAudience ? (matches ? 'valid' : 'invalid') : 'not-checked',
      message: expectedAudience ? (matches ? 'Matches expected audience.' : 'Does not match expected audience.') : 'Set an expected audience to validate.',
    });
  } else if (expectedAudience) {
    checks.push({ name: 'aud', label: 'Audience', value: undefined, status: 'invalid', message: 'Audience claim is missing.' });
  }

  for (const name of ['sub', 'jti']) {
    if (name in payload) {
      checks.push({
        name,
        label: name === 'sub' ? 'Subject' : 'JWT ID',
        value: payload[name],
        status: 'info',
        message: 'Informational claim; no expected value was provided.',
      });
    }
  }

  return checks;
}

async function inspectJwt(token, key, options) {
  const decoded = decodeJwt(token);
  const claimChecks = getClaimChecks(decoded.payload, options.expectedIssuer, options.expectedAudience);
  let verification = { status: 'not-checked', message: 'Signature was not verified. Provide a key to verify it.' };

  if (typeof decoded.header.alg !== 'string' || decoded.header.alg === 'none') {
    verification = { status: 'invalid', message: 'Unsigned or missing-algorithm JWTs cannot be verified.' };
  } else if (key.trim()) {
    try {
      const { compactVerify } = await import('jose');
      const cryptoKey = await importJwtKey(key, decoded.header.alg, {
        signing: false,
        base64UrlSecret: options.base64UrlSecret,
        keyId: decoded.header.kid,
      });
      await compactVerify(token, cryptoKey, { algorithms: [decoded.header.alg] });
      verification = { status: 'valid', message: `Signature verified with ${decoded.header.alg}.` };
    } catch (error) {
      verification = { status: 'invalid', message: error instanceof Error ? error.message : 'Signature verification failed.' };
    }
  }

  return { ...decoded, verification, claimChecks };
}

async function signJwt(payloadText, headerText, key, options) {
  let payload;
  let header;
  try {
    payload = JSON.parse(payloadText);
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('The JWT payload must be a JSON object.');
    }
  } catch (error) {
    throw new Error(`Could not parse the JWT payload: ${error.message}`);
  }
  try {
    header = JSON.parse(headerText);
    if (header === null || typeof header !== 'object' || Array.isArray(header)) {
      throw new Error('The JWT header must be a JSON object.');
    }
  } catch (error) {
    throw new Error(`Could not parse the JWT header: ${error.message}`);
  }
  if (typeof header.alg !== 'string' || header.alg === 'none') {
    throw new Error('Choose a signing algorithm other than "none".');
  }
  if (!key.trim()) throw new Error('Enter a secret or private key to sign the JWT.');

  const { SignJWT } = await import('jose');
  const cryptoKey = await importJwtKey(key, header.alg, {
    signing: true,
    base64UrlSecret: options.base64UrlSecret,
    keyId: header.kid,
  });
  return new SignJWT(payload).setProtectedHeader(header).sign(cryptoKey);
}

async function formatDocument(format, content) {
  const parserImports = {
    json: () => import('prettier/plugins/babel'),
    html: () => import('prettier/plugins/html'),
    xml: () => import('@prettier/plugin-xml'),
    markdown: () => import('prettier/plugins/markdown'),
    yaml: () => import('prettier/plugins/yaml'),
  };
  const [prettier, parserModule, estreeModule] = await Promise.all([
    import('prettier/standalone'),
    parserImports[format](),
    format === 'json' ? import('prettier/plugins/estree') : Promise.resolve(null),
  ]);
  const plugins = format === 'json'
    ? [parserModule.default, estreeModule.default]
    : [format === 'xml' ? parserModule.default : parserModule];
  const formattedContent = await prettier.format(content, {
    parser: format,
    plugins,
    tabWidth: 2,
  });

  return {
    formattedContent,
    previewHtml: format === 'markdown'
      ? (await import('marked')).marked.parse(formattedContent)
      : formattedContent,
  };
}

export async function processLocally({
  toolMode,
  format,
  content,
  fileName,
  jwtAction,
  jwtHeader,
  jwtKey,
  jwtOptions = {},
}) {
  if (toolMode === 'format') {
    const { formattedContent, previewHtml } = await formatDocument(format, content);
    return {
      formattedContent,
      previewHtml,
      fileName: fileName || `untitled.${format === 'markdown' ? 'md' : format}`,
      characterCount: content.length,
    };
  }

  let formattedContent;
  let outputFileName;
  if (toolMode === 'jwtDecode') {
    if (jwtAction === 'encode') {
      formattedContent = await signJwt(content, jwtHeader, jwtKey, jwtOptions);
      outputFileName = 'signed-jwt.txt';
      const decoded = decodeJwt(formattedContent);
      const jwtInfo = {
        ...decoded,
        verification: {
          status: 'signed',
          message: `Created with ${decoded.header.alg}. Verify the signature using its corresponding verification key.`,
        },
        claimChecks: getClaimChecks(decoded.payload, jwtOptions.expectedIssuer, jwtOptions.expectedAudience),
      };
      return {
        formattedContent,
        fileName: outputFileName,
        characterCount: content.length,
        jwtInfo,
      };
    } else {
      const jwtInfo = await inspectJwt(content.trim(), jwtKey, jwtOptions);
      formattedContent = JSON.stringify({
        header: jwtInfo.header,
        payload: jwtInfo.payload,
        signature: jwtInfo.signature,
      }, null, 2);
      return {
        formattedContent,
        fileName: 'decoded-jwt.json',
        characterCount: content.length,
        jwtInfo,
      };
    }
  } else if (toolMode === 'base64Encode') {
    formattedContent = encodeBase64Url(content);
    outputFileName = 'encoded.txt';
  } else if (toolMode === 'base64Decode') {
    formattedContent = decodeBase64Url(content);
    outputFileName = 'decoded.txt';
  } else {
    throw new Error(`Unsupported tool: ${toolMode}.`);
  }

  return {
    formattedContent,
    fileName: outputFileName,
    characterCount: content.length,
  };
}
