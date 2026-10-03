import React, { useMemo, useRef, useState } from 'react';
import {
  Braces,
  Check,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Code2,
  Download,
  Expand,
  FileCode2,
  FileJson,
  FileText,
  FileUp,
  LoaderCircle,
  Moon,
  PanelTop,
  Shrink,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { processLocally } from './localTools.js';

const MAX_BYTES = 1_048_576;
const FORMATS = [
  { id: 'json', label: 'JSON', extension: 'json', icon: Braces },
  { id: 'html', label: 'HTML', extension: 'html', icon: Code2 },
  { id: 'xml', label: 'XML', extension: 'xml', icon: FileCode2 },
  { id: 'markdown', label: 'Markdown', extension: 'md', icon: FileText },
  { id: 'yaml', label: 'YAML', extension: 'yaml', icon: FileText },
];
const JWT_ALGORITHMS = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512', 'EdDSA'];

function getInitialTheme() {
  try {
    return localStorage.getItem('format-studio-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function getPreviewDocument(markup) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>
    *{box-sizing:border-box}body{margin:0;padding:28px;color:#26332d;background:#fff;font:15px/1.65 Georgia,serif;overflow-wrap:anywhere}
    h1,h2,h3,h4,h5,h6{font-family:Arial,sans-serif;line-height:1.2;margin:1.4em 0 .55em}h1{margin-top:0}
    p,ul,ol,blockquote,pre,table{margin:0 0 1em}a{color:#176a4b}blockquote{border-left:3px solid #c9d6cc;padding-left:16px;color:#52635a}
    pre,code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#f2f5f1}pre{padding:14px;white-space:pre-wrap;border-radius:4px}
    code{padding:2px 4px;border-radius:3px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dce3dd;padding:8px 10px;text-align:left}
    img{max-width:100%;height:auto}hr{border:0;border-top:1px solid #dce3dd;margin:24px 0}
  </style></head><body>${markup}</body></html>`;
}

function createJsonTree(value, label = '$', id = 'json-root') {
  if (Array.isArray(value)) {
    const children = value.map((item, index) => createJsonTree(item, `[${index}]`, `${id}-${index}`));
    return {
      id,
      label,
      opening: '[',
      closing: ']',
      children,
      value: children.length ? undefined : '[]',
    };
  }

  if (value !== null && typeof value === 'object') {
    const children = Object.entries(value).map(([key, item], index) => (
      createJsonTree(item, `${JSON.stringify(key)}:`, `${id}-${index}`)
    ));
    return {
      id,
      label,
      opening: '{',
      closing: '}',
      children,
      value: children.length ? undefined : '{}',
    };
  }

  return {
    id,
    label,
    value: JSON.stringify(value),
    valueType: value === null ? 'null' : typeof value,
  };
}

function createXmlTree(xml) {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parseError = document.querySelector('parsererror');
  if (parseError) throw new Error(parseError.textContent || 'The XML could not be parsed.');

  function createNode(node, id) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const attributes = Array.from(node.attributes, (attribute) => (
        ` ${attribute.name}="${attribute.value}"`
      )).join('');
      const children = Array.from(node.childNodes)
        .filter((child) => child.nodeType !== Node.TEXT_NODE || child.nodeValue.trim())
        .map((child, index) => createNode(child, `${id}-${index}`));
      return {
        id,
        label: `<${node.nodeName}${attributes}${children.length ? '>' : ' />'}`,
        closing: children.length ? `</${node.nodeName}>` : '',
        children,
      };
    }

    if (node.nodeType === Node.TEXT_NODE) {
      return { id, label: node.nodeValue, valueType: 'text' };
    }

    if (node.nodeType === Node.CDATA_SECTION_NODE) {
      return { id, label: `<![CDATA[${node.nodeValue}]]>`, valueType: 'text' };
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      return { id, label: `<!-- ${node.nodeValue} -->`, valueType: 'text' };
    }

    if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      return { id, label: `<?${node.nodeName} ${node.nodeValue}?>`, valueType: 'text' };
    }

    if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
      return { id, label: `<!DOCTYPE ${node.nodeName}>`, valueType: 'text' };
    }

    return { id, label: node.nodeName, valueType: 'text' };
  }

  return {
    id: 'xml-root',
    label: 'XML document',
    children: Array.from(document.childNodes)
      .filter((node) => node.nodeType !== Node.TEXT_NODE || node.nodeValue.trim())
      .map((node, index) => createNode(node, `xml-${index}`)),
  };
}

function collectBranchIds(node) {
  if (!node.children?.length) return [];
  return [node.id, ...node.children.flatMap(collectBranchIds)];
}

function TreeNode({ node, expandedNodes, setExpandedNodes }) {
  const isBranch = Boolean(node.children?.length);
  const isExpanded = expandedNodes[node.id] ?? true;

  return (
    <div className="tree-node">
      <div className="tree-row">
        {isBranch ? (
          <button
            className="tree-toggle"
            type="button"
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.label}`}
            aria-expanded={isExpanded}
            onClick={() => setExpandedNodes((current) => ({ ...current, [node.id]: !isExpanded }))}
          >
            {isExpanded ? '-' : '+'}
          </button>
        ) : <span className="tree-toggle-placeholder" />}
        <span className={`tree-label ${node.valueType ? `tree-value-${node.valueType}` : ''}`}>{node.label}</span>
        {node.opening && <span className="tree-delimiter">{node.opening}</span>}
        {node.value !== undefined && <span className={`tree-value tree-value-${node.valueType || 'container'}`}>{node.value}</span>}
        {isBranch && !isExpanded && <span className="tree-summary">... {node.closing}</span>}
      </div>
      {isBranch && isExpanded && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              setExpandedNodes={setExpandedNodes}
            />
          ))}
          {node.closing && <div className="tree-closing">{node.closing}</div>}
        </div>
      )}
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [toolMode, setToolMode] = useState('format');
  const [format, setFormat] = useState('json');
  const [fileName, setFileName] = useState('untitled.json');
  const [content, setContent] = useState('');
  const [result, setResult] = useState(null);
  const [outputMode, setOutputMode] = useState('tree');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [jwtAction, setJwtAction] = useState('decode');
  const [jwtHeader, setJwtHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [jwtKey, setJwtKey] = useState('');
  const [jwtBase64UrlSecret, setJwtBase64UrlSecret] = useState(false);
  const [expectedIssuer, setExpectedIssuer] = useState('');
  const [expectedAudience, setExpectedAudience] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);

  const byteCount = new TextEncoder().encode(content).length;
  const activeFormat = FORMATS.find((item) => item.id === format);
  const isFormatter = toolMode === 'format';
  const supportsTree = isFormatter && (format === 'json' || format === 'xml');
  const supportsPreview = isFormatter && (format === 'html' || format === 'markdown');
  const toolDetails = {
    format: { label: `${activeFormat.label} formatter`, input: `Unformatted ${activeFormat.label} content`, placeholder: `Paste your ${activeFormat.label} here...` },
    jwtDecode: {
      label: jwtAction === 'decode' ? 'JWT debugger' : 'JWT encoder',
      input: jwtAction === 'decode' ? 'Encoded JWT' : 'JWT payload (JSON)',
      placeholder: jwtAction === 'decode' ? 'Paste a JWT to decode and verify...' : 'Enter a JSON payload to sign...',
    },
    base64Encode: { label: 'Base64 URL encoder', input: 'Text to encode', placeholder: 'Enter text to Base64 URL-encode...' },
    base64Decode: { label: 'Base64 URL decoder', input: 'Base64 text to decode', placeholder: 'Paste Base64 URL-encoded text...' },
  }[toolMode];
  const structuredTree = useMemo(() => {
    if (!result || !supportsTree) return null;
    try {
      return {
        tree: format === 'json'
          ? createJsonTree(JSON.parse(result.formattedContent))
          : createXmlTree(result.formattedContent),
        error: '',
      };
    } catch (treeError) {
      return {
        tree: null,
        error: treeError instanceof Error ? treeError.message : 'Could not parse the formatted document.',
      };
    }
  }, [format, result, supportsTree]);

  function updateContent(value) {
    setContent(value);
    setResult(null);
    setError('');
    setNotice('');
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('format-studio-theme', nextTheme);
    } catch {
      setError('Theme changed, but this browser could not save your preference.');
    }
  }

  function selectFormat(nextFormat) {
    setToolMode('format');
    setFormat(nextFormat);
    setFileName((current) => {
      const baseName = current.replace(/\.[^.]+$/, '') || 'untitled';
      const extension = FORMATS.find((item) => item.id === nextFormat).extension;
      return `${baseName}.${extension}`;
    });
    setResult(null);
    setError('');
    setOutputMode(nextFormat === 'html' || nextFormat === 'markdown'
      ? 'preview'
      : nextFormat === 'json' || nextFormat === 'xml' ? 'tree' : 'source');
  }

  function selectTool(nextTool) {
    setToolMode(nextTool);
    setResult(null);
    setError('');
    setNotice('');
    setOutputMode(nextTool === 'format'
      ? (format === 'html' || format === 'markdown'
        ? 'preview'
        : format === 'json' || format === 'xml' ? 'tree' : 'source')
      : 'source');
  }

  async function processDocument() {
    setError('');
    setNotice('');
    if (!content.trim() && !(toolMode === 'jwtDecode' && jwtAction === 'encode')) {
      setError(`Add some content before using the ${toolDetails.label}.`);
      return;
    }
    if (byteCount > MAX_BYTES) {
      setError('This input is over the 1 MiB limit.');
      return;
    }

    setBusy(true);
    setResult(null);
    setExpandedNodes({});
    try {
      const nextResult = await processLocally({
        toolMode,
        format,
        content,
        fileName,
        jwtAction,
        jwtHeader,
        jwtKey,
        jwtOptions: { base64UrlSecret: jwtBase64UrlSecret, expectedIssuer, expectedAudience },
      });
      setResult(nextResult);
      setOutputMode(toolMode === 'format'
        ? (format === 'html' || format === 'markdown'
          ? 'preview'
          : format === 'json' || format === 'xml' ? 'tree' : 'source')
        : 'source');
      setNotice(toolMode === 'jwtDecode' && jwtAction === 'encode' ? 'JWT signed locally' : `${toolDetails.label} complete`);
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Could not process this input.');
    } finally {
      setBusy(false);
    }
  }

  async function copyOutput() {
    if (!result) return;
    const value = outputMode === 'preview' ? result.previewHtml : result.formattedContent;
    try {
      await navigator.clipboard.writeText(value);
      setNotice(outputMode === 'preview' ? 'Preview markup copied' : isFormatter ? 'Formatted source copied' : 'Result copied');
    } catch {
      setError('Clipboard access is unavailable in this browser.');
    }
  }

  function downloadOutput() {
    if (!result) return;
    const blob = new Blob([result.formattedContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = result.fileName || fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setNotice('File downloaded');
  }

  async function loadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const matchingFormat = FORMATS.find((item) => item.extension === extension
      || (item.id === 'markdown' && extension === 'markdown')
      || (item.id === 'yaml' && extension === 'yml'));
    if (!matchingFormat) {
      setError('Choose a JSON, HTML, XML, YAML, or Markdown file.');
      event.target.value = '';
      return;
    }
    try {
      const fileContent = await file.text();
      setFileName(file.name);
      setFormat(matchingFormat.id);
      setContent(fileContent);
      setResult(null);
      setError('');
      setOutputMode(matchingFormat.id === 'html' || matchingFormat.id === 'markdown'
        ? 'preview'
        : matchingFormat.id === 'json' || matchingFormat.id === 'xml' ? 'tree' : 'source');
    } catch (fileError) {
      setError(fileError instanceof Error ? `Could not read the selected file: ${fileError.message}` : 'Could not read the selected file.');
    } finally {
      event.target.value = '';
    }
  }

  async function generateJwtExample() {
    const demoKey = 'a-string-secret-at-least-256-bits-long';
    const payload = JSON.stringify({
      sub: '1234567890',
      name: 'John Doe',
      admin: true,
      iat: 1516239022,
    }, null, 2);
    const header = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const signed = await processLocally({
        toolMode: 'jwtDecode',
        jwtAction: 'encode',
        content: payload,
        jwtHeader: header,
        jwtKey: demoKey,
      });
      const inspected = await processLocally({
        toolMode: 'jwtDecode',
        jwtAction: 'decode',
        content: signed.formattedContent,
        jwtKey: demoKey,
      });
      setJwtAction('decode');
      setJwtHeader(header);
      setJwtKey(demoKey);
      setJwtBase64UrlSecret(false);
      setExpectedIssuer('');
      setExpectedAudience('');
      setContent(signed.formattedContent);
      setResult(inspected);
      setError('');
      setNotice('Verified example loaded. Its secret is public and for demos only.');
      setOutputMode('source');
    } catch (exampleError) {
      setError(exampleError instanceof Error ? exampleError.message : 'Could not generate the JWT example.');
    } finally {
      setBusy(false);
    }
  }

  function changeJwtAction(nextAction) {
    if (result?.jwtInfo) {
      if (nextAction === 'encode' && jwtAction === 'decode') {
        setContent(JSON.stringify(result.jwtInfo.payload, null, 2));
        setJwtHeader(JSON.stringify(result.jwtInfo.header, null, 2));
      } else if (nextAction === 'decode' && jwtAction === 'encode') {
        setContent(result.formattedContent);
      }
    }
    setJwtAction(nextAction);
    setResult(null);
    setError('');
    setOutputMode('source');
  }

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark-mode' : ''}`} data-theme={theme}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Format Studio home">
          <span className="brand-mark"><Braces size={20} strokeWidth={2.2} /></span>
          <span>format<span className="brand-light">studio</span></span>
        </a>
        <div className="topbar-right">
          <span className="local-status">
            <span className="status-dot" />
            Runs locally in your browser
          </span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'dark'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <div className="eyebrow">DEVELOPER TOOLKIT <span className="eyebrow-rule" /></div>
            <h1>Format <span>Studio</span></h1>
          </div>
          <div className="format-count"><span>{String(FORMATS.length).padStart(2, '0')}</span> FORMATS</div>
        </div>

        <nav className="format-tabs" aria-label="Developer tools">
          {FORMATS.slice(0, 1).map(({ id, label, icon: Icon }) => (
            <button className={`format-tab ${isFormatter && format === id ? 'active' : ''}`} type="button" key={id} aria-pressed={isFormatter && format === id} onClick={() => selectFormat(id)}>
              <Icon size={16} strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          ))}
          <button className={`utility-tab ${toolMode === 'jwtDecode' ? 'active' : ''}`} type="button" aria-pressed={toolMode === 'jwtDecode'} onClick={() => selectTool('jwtDecode')}>JWT debugger</button>
          {FORMATS.slice(1).map(({ id, label, icon: Icon }) => (
            <button className={`format-tab ${isFormatter && format === id ? 'active' : ''}`} type="button" key={id} aria-pressed={isFormatter && format === id} onClick={() => selectFormat(id)}>
              <Icon size={16} strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          ))}
          <span className="tool-divider" />
          <button className={`utility-tab ${toolMode === 'base64Encode' ? 'active' : ''}`} type="button" aria-pressed={toolMode === 'base64Encode'} onClick={() => selectTool('base64Encode')}>Base64 encode</button>
          <button className={`utility-tab ${toolMode === 'base64Decode' ? 'active' : ''}`} type="button" aria-pressed={toolMode === 'base64Decode'} onClick={() => selectTool('base64Decode')}>Base64 decode</button>
          {isFormatter && <span className="tabs-spacer" />}
          {isFormatter && (
            <>
              <button className="subtle-action upload-action" type="button" onClick={() => fileInputRef.current?.click()}>
                <FileUp size={15} /><span>Open file</span>
              </button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept=".json,.html,.htm,.xml,.md,.markdown,.yaml,.yml" onChange={loadFile} />
            </>
          )}
        </nav>

        <section className="editor-grid" aria-label={toolDetails.label}>
          <article className={`editor-panel input-panel ${toolMode === 'jwtDecode' ? 'jwt-panel' : ''}`}>
            <div className="panel-heading">
              <div className="panel-title-group">
                <span className="panel-index">01</span>
                <h2>Input</h2>
                <span className="panel-caption">{isFormatter ? 'Paste or write your document' : toolDetails.label}</span>
              </div>
              <div className="panel-tools">
                <button className="icon-button" type="button" aria-label="Clear input" title="Clear input" onClick={() => { updateContent(''); setFileName(`untitled.${activeFormat.extension}`); }} disabled={!content}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="document-bar">
              {isFormatter
                ? <div className="filename-wrap"><FileJson size={15} /><input aria-label="Document filename" value={fileName} onChange={(event) => setFileName(event.target.value)} /></div>
                : <span className="utility-input-label">{toolDetails.input}</span>}
              <span className="format-chip">{isFormatter ? activeFormat.label : toolMode === 'jwtDecode' ? 'JWT' : 'BASE64 URL'}</span>
            </div>
            {toolMode === 'jwtDecode' && (
              <div className="jwt-mode-bar" role="tablist" aria-label="JWT mode">
                <button type="button" role="tab" aria-selected={jwtAction === 'decode'} className={jwtAction === 'decode' ? 'selected' : ''} onClick={() => changeJwtAction('decode')}>Decode / verify</button>
                <button type="button" role="tab" aria-selected={jwtAction === 'encode'} className={jwtAction === 'encode' ? 'selected' : ''} onClick={() => changeJwtAction('encode')}>Encode / sign</button>
                <button className="jwt-example-button" type="button" onClick={generateJwtExample} disabled={busy}>Generate example</button>
              </div>
            )}
            <label className="visually-hidden" htmlFor="document-input">{toolDetails.input}</label>
            <textarea
              id="document-input"
              className="code-input"
              spellCheck="false"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={toolDetails.placeholder}
              value={content}
              onChange={(event) => updateContent(event.target.value)}
            />
            {toolMode === 'jwtDecode' && jwtAction === 'encode' && (
              <div className="jwt-extra-fields">
                <label className="jwt-field">
                  <span>Protected header</span>
                  <textarea className="jwt-json-input" spellCheck="false" value={jwtHeader} onChange={(event) => { setJwtHeader(event.target.value); setResult(null); }} />
                </label>
                <label className="jwt-field">
                  <span>Signing algorithm</span>
                  <select value={(() => { try { return JSON.parse(jwtHeader).alg || 'HS256'; } catch { return 'HS256'; } })()} onChange={(event) => {
                    try {
                      const header = JSON.parse(jwtHeader);
                      setJwtHeader(JSON.stringify({ ...header, alg: event.target.value }, null, 2));
                      setResult(null);
                    } catch {
                      setError('Fix the protected header JSON before selecting an algorithm.');
                    }
                  }}>
                    {JWT_ALGORITHMS.map((algorithm) => <option key={algorithm} value={algorithm}>{algorithm}</option>)}
                  </select>
                </label>
              </div>
            )}
            {toolMode === 'jwtDecode' && (
              <div className="jwt-extra-fields">
                <label className="jwt-field jwt-key-field">
                  <span>{jwtAction === 'decode' ? 'Verification key (optional)' : 'Signing secret or private key'}</span>
                  <textarea className="jwt-key-input" spellCheck="false" autoCapitalize="off" autoCorrect="off" value={jwtKey} placeholder="HMAC secret, JWK/JWKS JSON, or PEM key" onChange={(event) => { setJwtKey(event.target.value); setResult(null); }} />
                </label>
                <label className="jwt-checkbox">
                  <input type="checkbox" checked={jwtBase64UrlSecret} onChange={(event) => { setJwtBase64UrlSecret(event.target.checked); setResult(null); }} />
                  Treat HMAC key as Base64URL-encoded bytes
                </label>
                {jwtAction === 'decode' && (
                  <div className="jwt-claim-expectations">
                    <label className="jwt-field"><span>Expected issuer (optional)</span><input value={expectedIssuer} onChange={(event) => { setExpectedIssuer(event.target.value); setResult(null); }} /></label>
                    <label className="jwt-field"><span>Expected audience (optional)</span><input value={expectedAudience} onChange={(event) => { setExpectedAudience(event.target.value); setResult(null); }} /></label>
                  </div>
                )}
              </div>
            )}
            <div className="editor-footer">
              <span className={byteCount > MAX_BYTES ? 'size-warning' : ''}>{byteCount.toLocaleString()} bytes <span className="footer-divider">/</span> 1 MiB</span>
              <span>{content.length.toLocaleString()} characters</span>
            </div>
            {toolMode === 'jwtDecode' && <p className="utility-warning">Tokens and keys stay in this browser. Verification needs the matching key; never trust claims until verification succeeds.</p>}
          </article>

          <div className="process-rail" aria-hidden="true"><span><ChevronDown size={17} /></span></div>

          <article className={`editor-panel output-panel ${toolMode === 'jwtDecode' ? 'jwt-panel' : ''}`}>
            <div className="panel-heading output-heading">
              <div className="panel-title-group">
                <span className="panel-index">02</span>
                <h2>Result</h2>
                {result && <span className="success-label"><Check size={12} /> Ready</span>}
              </div>
              <div className="panel-tools output-tools">
                <button className="icon-button" type="button" aria-label="Copy result" title="Copy result" onClick={copyOutput} disabled={!result}><Clipboard size={15} /></button>
                <button className="icon-button" type="button" aria-label="Download formatted file" title="Download formatted file" onClick={downloadOutput} disabled={!result}><Download size={15} /></button>
              </div>
            </div>
            <div className="result-bar">
              <div className="view-switch" role="tablist" aria-label="Result view">
                {supportsPreview && <button className={outputMode === 'preview' ? 'selected' : ''} type="button" role="tab" aria-selected={outputMode === 'preview'} onClick={() => setOutputMode('preview')}><PanelTop size={14} /> Preview</button>}
                <button className={outputMode === 'source' ? 'selected' : ''} type="button" role="tab" aria-selected={outputMode === 'source'} onClick={() => setOutputMode('source')}><Code2 size={14} /> Source</button>
                {supportsTree && <button className={outputMode === 'tree' ? 'selected' : ''} type="button" role="tab" aria-selected={outputMode === 'tree'} onClick={() => setOutputMode('tree')}><Braces size={14} /> Tree</button>}
                {toolMode === 'jwtDecode' && jwtAction === 'decode' && result?.jwtInfo && <button className={outputMode === 'claims' ? 'selected' : ''} type="button" role="tab" aria-selected={outputMode === 'claims'} onClick={() => setOutputMode('claims')}>Claims breakdown</button>}
              </div>
              {outputMode === 'tree' && supportsTree && result && structuredTree?.tree ? (
                <div className="tree-actions">
                  <button type="button" onClick={() => setExpandedNodes(Object.fromEntries(collectBranchIds(structuredTree.tree).map((id) => [id, true])))}>
                    <Expand size={12} /> Expand all
                  </button>
                  <button type="button" onClick={() => setExpandedNodes(Object.fromEntries(collectBranchIds(structuredTree.tree).map((id) => [id, false])))}>
                    <Shrink size={12} /> Collapse all
                  </button>
                </div>
              ) : (
                <span className="result-type">{outputMode === 'preview' ? 'RENDERED VIEW' : outputMode === 'claims' ? 'CLAIMS BREAKDOWN' : outputMode === 'tree' && supportsTree ? 'STRUCTURED TREE' : isFormatter ? 'FORMATTED SOURCE' : 'UTILITY OUTPUT'}</span>
              )}
            </div>
            <div className={`result-content ${outputMode === 'preview' ? 'preview-content' : ''}`}>
              {result ? (
                toolMode === 'jwtDecode' && outputMode === 'claims' && result.jwtInfo ? (
                  <div className="jwt-claims-list">
                    {result.jwtInfo.claimChecks.length
                      ? result.jwtInfo.claimChecks.map((claim) => (
                        <div className="jwt-claim-row" key={claim.name}>
                          <div><strong>{claim.label}</strong><code>{claim.name}</code><span>{claim.message}</span></div>
                          <pre>{claim.value === undefined
                            ? '—'
                            : ['exp', 'nbf', 'iat'].includes(claim.name) && typeof claim.value === 'number'
                              ? `${JSON.stringify(claim.value)} · ${new Date(claim.value * 1000).toLocaleString()}`
                              : JSON.stringify(claim.value, null, 2)}</pre>
                          <b className={`jwt-check-status ${claim.status}`}>{claim.status.replace('-', ' ')}</b>
                        </div>
                      ))
                      : <p className="jwt-empty-claims">No registered claims found in the payload.</p>}
                  </div>
                ) : toolMode === 'jwtDecode' && result.jwtInfo ? (
                  <div className="jwt-result">
                    <div className={`jwt-verification-status ${result.jwtInfo.verification.status}`}>
                      <strong>{jwtAction === 'encode' ? 'Token signed locally' : result.jwtInfo.verification.status === 'valid' ? 'Signature verified' : result.jwtInfo.verification.status === 'invalid' ? 'Signature invalid' : 'Signature not verified'}</strong>
                      <span>{result.jwtInfo.verification.message}</span>
                    </div>
                    <pre className="code-output"><code>{result.formattedContent}</code></pre>
                  </div>
                ) : supportsPreview && outputMode === 'preview' ? (
                  <iframe className="preview-frame" title={`${activeFormat.label} rendered preview`} sandbox="" srcDoc={getPreviewDocument(result.previewHtml)} />
                ) : outputMode === 'tree' && supportsTree ? (
                  structuredTree.error ? (
                    <div className="tree-error">Could not display the tree: {structuredTree.error}. Switch to Source to view the formatted text.</div>
                  ) : (
                    <div className="structured-tree">
                      <TreeNode node={structuredTree.tree} expandedNodes={expandedNodes} setExpandedNodes={setExpandedNodes} />
                    </div>
                  )
                ) : (
                  <pre className="code-output"><code>{result.formattedContent}</code></pre>
                )
              ) : (
                <div className="empty-result">
                  <div className="empty-icon"><Sparkles size={19} /></div>
                  <p>{toolMode === 'jwtDecode' ? 'Your JWT result' : 'Your formatted document'}<br />will appear here</p>
                  <span>Ready when you are</span>
                </div>
              )}
              {busy && <div className="loading-overlay"><LoaderCircle size={23} className="spinner" /><span>Processing {toolDetails.label}...</span></div>}
            </div>
            <div className="editor-footer result-footer">
              <span>{result ? `${(result.characterCount ?? 0).toLocaleString()} input characters` : 'Output will appear here'}</span>
              <span className="result-footer-mark">FORMAT STUDIO <span>•</span></span>
            </div>
          </article>
        </section>

        <div className="action-row">
          <div className="feedback" aria-live="polite">
            {error ? <><CircleAlert size={15} /><span>{error}</span></> : notice ? <><Check size={15} /><span>{notice}</span></> : <span className="quiet-feedback">{toolMode === 'jwtDecode' ? 'Decode, sign, verify signatures, and inspect registered claims locally' : toolMode === 'base64Encode' ? 'Encodes as unpadded Base64 URL-safe text' : toolMode === 'base64Decode' ? 'Decodes Base64 URL-safe text' : supportsPreview ? 'Preview is isolated in a sandbox' : 'Source is formatted locally in your browser'}</span>}
          </div>
          <button className="button button-primary process-button" type="button" onClick={processDocument} disabled={busy || !content.trim()}>
            {busy ? <LoaderCircle size={16} className="spinner" /> : <Sparkles size={16} />}
            <span>{busy ? 'Processing...' : isFormatter ? 'Format document' : toolDetails.label}</span>
          </button>
        </div>
        <div className="workspace-bottom"><span>JSON <i /> HTML <i /> XML <i /> MARKDOWN <i /> YAML</span><span>LOCAL INPUT <i /> NO FILES STORED</span></div>
      </main>
    </div>
  );
}

export default App;