import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Braces,
  Check,
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
  Maximize2,
  Minimize2,
  Moon,
  PanelTop,
  Shrink,
  Sparkles,
  Sun,
  Trash2,
  WrapText,
} from 'lucide-react';
import { processLocally } from './localTools.js';
import { getSeoPage, renderSeoContent, SEO_PAGES } from './seoPages.js';

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

const SAMPLES = {
  json: '{\n  "name": "Format Studio",\n  "version": "2.0.0",\n  "description": "Client-side developer utilities",\n  "tools": [\n    "json",\n    "html",\n    "xml",\n    "markdown",\n    "yaml"\n  ],\n  "active": true\n}',
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Sample Preview</title>\n  <style>\n    body { font-family: sans-serif; padding: 20px; }\n    .hero { background: #eaf2e8; border-radius: 8px; padding: 20px; color: #176a4b; }\n    h1 { margin-top: 0; font-size: 22px; }\n    p { color: #3d5245; font-size: 14px; }\n  </style>\n</head>\n<body>\n  <div class="hero">\n    <h1>Welcome to Format Studio</h1>\n    <p>Local, private developer utilities formatted right in your browser.</p>\n  </div>\n</body>\n</html>',
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n  <tool id="format-studio">\n    <name>Format Studio</name>\n    <category>Developer Tools</category>\n    <formats>\n      <format>JSON</format>\n      <format>HTML</format>\n      <format>XML</format>\n      <format>Markdown</format>\n      <format>YAML</format>\n    </formats>\n  </tool>\n</catalog>',
  markdown: '# Format Studio\n\nFast, client-side formatting and live preview for developers.\n\n## Features\n- [x] **100% Client-Side**: No data is sent to external servers\n- [x] **Multiple Formats**: JSON, HTML, XML, Markdown, YAML\n- [x] **Mermaid Diagrams**: Interactive flowcharts & charts\n- [ ] Offline caching\n\n## Architecture Diagram\n```mermaid\ngraph TD\n  A[User Input] --> B{Local Formatter}\n  B --> C[Interactive Tree]\n  B --> D[Live Preview]\n```\n\n| Format | Viewer | Status |\n| :--- | :--- | :--- |\n| JSON | Tree / Source | Ready |\n| HTML | Live Preview | Ready |\n| Markdown | GFM + Mermaid | Ready |',
  yaml: 'name: Format Studio\nversion: 2.0.0\nenvironment: production\nserver:\n  host: 0.0.0.0\n  port: 8080\nfeatures:\n  - json-formatter\n  - html-formatter\n  - xml-formatter\n  - markdown-preview\n  - yaml-formatter\n  - jwt-debugger\n  - base64-tools',
  jwtDecode: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJhdWQiOiJhcGkifQ.YQe8-b80D-l8Xv_zE0J21V6ZcR1vUj4Q6iI6qL7Y1pA',
  base64Encode: 'Format Studio: 100% Client-side developer tools',
  base64Decode: 'Rm9ybWF0IFN0dWRpbzogMTAwJSBDbGllbnQtc2lkZSBkZXZlbG9wZXIgdG9vbHM',
};

const DEFAULT_FILENAMES = {
  json: 'untitled.json',
  html: 'untitled.html',
  xml: 'untitled.xml',
  markdown: 'untitled.md',
  yaml: 'untitled.yaml',
  jwtDecode: 'decoded-jwt.json',
  base64Encode: 'encoded.txt',
  base64Decode: 'decoded.txt',
};

const DEFAULT_OUTPUT_MODES = {
  json: 'tree',
  html: 'preview',
  xml: 'tree',
  markdown: 'preview',
  yaml: 'source',
  jwtDecode: 'source',
  base64Encode: 'source',
  base64Decode: 'source',
};

function getInitialTabDocs() {
  return {
    json: { content: '', result: null, fileName: 'untitled.json', error: '', notice: '', outputMode: 'tree' },
    html: { content: '', result: null, fileName: 'untitled.html', error: '', notice: '', outputMode: 'preview' },
    xml: { content: '', result: null, fileName: 'untitled.xml', error: '', notice: '', outputMode: 'tree' },
    markdown: { content: '', result: null, fileName: 'untitled.md', error: '', notice: '', outputMode: 'preview' },
    yaml: { content: '', result: null, fileName: 'untitled.yaml', error: '', notice: '', outputMode: 'source' },
    jwtDecode: { content: '', result: null, fileName: 'decoded-jwt.json', error: '', notice: '', outputMode: 'source' },
    base64Encode: { content: '', result: null, fileName: 'encoded.txt', error: '', notice: '', outputMode: 'source' },
    base64Decode: { content: '', result: null, fileName: 'decoded.txt', error: '', notice: '', outputMode: 'source' },
  };
}

function getPreviewDocument(markup, theme = 'light') {
  if (!markup) return '';
  const isDark = theme === 'dark';
  const bg = isDark ? '#171e19' : '#fff';
  const fg = isDark ? '#d2ded4' : '#26332d';
  const headingFg = isDark ? '#eef4ef' : '#26332d';
  const linkFg = isDark ? '#83bd94' : '#176a4b';
  const codeBg = isDark ? '#202922' : '#f2f5f1';
  const border = isDark ? '#354138' : '#dce3dd';
  const quoteFg = isDark ? '#9db0a0' : '#52635a';
  const quoteBorder = isDark ? '#3d4d40' : '#c9d6cc';

  const defaultStyles = `
    *{box-sizing:border-box}
    body{margin:0;padding:24px;color:${fg};background:${bg};font:15px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow-wrap:anywhere}
    h1,h2,h3,h4,h5,h6{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.25;margin:1.2em 0 .5em;color:${headingFg}}
    h1{margin-top:0}
    p,ul,ol,blockquote,pre,table{margin:0 0 1em}
    a{color:${linkFg}}
    blockquote{border-left:3px solid ${quoteBorder};padding-left:16px;color:${quoteFg};margin:1em 0}
    pre,code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:${codeBg}}
    pre{padding:14px;white-space:pre-wrap;border-radius:4px;overflow-x:auto}
    code{padding:2px 4px;border-radius:3px}
    table{border-collapse:collapse;width:100%;margin:1.2em 0}
    th,td{border:1px solid ${border};padding:8px 12px;text-align:left}
    th{background:${isDark ? '#202a23' : '#f0f5ee'};font-weight:600}
    img{max-width:100%;height:auto}
    hr{border:0;border-top:1px solid ${border};margin:24px 0}
    ul:has(input[type="checkbox"]) { list-style: none; padding-left: 4px; }
    li:has(input[type="checkbox"]) { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
    input[type="checkbox"] { width: 16px; height: 16px; accent-color: ${linkFg}; margin: 0; }
    .mermaid {
      display: flex;
      justify-content: center;
      padding: 16px;
      background: ${isDark ? '#141c16' : '#f8faf7'};
      border: 1px solid ${border};
      border-radius: 6px;
      margin: 1.5em 0;
      overflow-x: auto;
    }
    .mermaid svg { max-width: 100%; height: auto; }
  `;

  const hasMermaid = markup.includes('class="mermaid"');
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob: https:; script-src 'unsafe-inline' https://cdn.jsdelivr.net;">`;
  const themeStyle = `<style>:root{color-scheme:${isDark ? 'dark' : 'light'};}${defaultStyles}</style>`;
  const mermaidScript = hasMermaid ? `
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
      try {
        mermaid.initialize({
          startOnLoad: true,
          theme: '${isDark ? 'dark' : 'default'}',
          securityLevel: 'loose'
        });
      } catch (e) {
        console.error('Mermaid render error:', e);
      }
    </script>
  ` : '';

  const isFullHtml = /<!DOCTYPE|<html/i.test(markup);
  if (isFullHtml) {
    if (/<head[^>]*>/i.test(markup)) {
      return markup.replace(/(<head[^>]*>)/i, (match) => `${match}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${cspMeta}${themeStyle}${mermaidScript}`);
    }
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${cspMeta}${themeStyle}${mermaidScript}</head>${markup}</html>`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${cspMeta}${themeStyle}${mermaidScript}</head><body>${markup}</body></html>`;
}

function updatePageMetadata(page) {
  document.title = page.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = page.description;
  const seoContent = document.getElementById('seo-content-container');
  if (seoContent) seoContent.innerHTML = renderSeoContent(page);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = `${window.location.origin}${page.route}`;
  for (const property of ['og:title', 'og:description']) {
    const meta = document.querySelector(`meta[property="${property}"]`);
    if (meta) meta.content = property === 'og:title' ? page.title : page.description;
  }
}

function navigateToPage(page) {
  if (window.location.pathname !== page.route) {
    window.history.pushState({}, '', page.route);
  }
  updatePageMetadata(page);
}

function getFormatPage(format) {
  return SEO_PAGES.find((page) => page.format === format);
}

function getToolPage(toolMode) {
  return SEO_PAGES.find((page) => page.toolMode === toolMode);
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
  const initialPage = getSeoPage(window.location.pathname);
  const [theme, setTheme] = useState(getInitialTheme);
  const [toolMode, setToolMode] = useState(initialPage.toolMode || 'format');
  const [format, setFormat] = useState(initialPage.format || 'json');
  const [tabDocs, setTabDocs] = useState(getInitialTabDocs);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [jwtAction, setJwtAction] = useState('decode');
  const [jwtHeader, setJwtHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [jwtKey, setJwtKey] = useState('');
  const [jwtBase64UrlSecret, setJwtBase64UrlSecret] = useState(false);
  const [expectedIssuer, setExpectedIssuer] = useState('');
  const [expectedAudience, setExpectedAudience] = useState('');
  const [busy, setBusy] = useState(false);
  const [maximizedPanel, setMaximizedPanel] = useState(null);
  const [isFullWindow, setIsFullWindow] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [splitRatio, setSplitRatio] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const gridRef = useRef(null);

  const activeKey = toolMode === 'format' ? format : toolMode;
  const currentDoc = tabDocs[activeKey] || tabDocs.json;
  const content = currentDoc.content || '';
  const result = currentDoc.result || null;
  const fileName = currentDoc.fileName || DEFAULT_FILENAMES[activeKey] || 'untitled.txt';
  const error = currentDoc.error || '';
  const notice = currentDoc.notice || '';
  const outputMode = currentDoc.outputMode || DEFAULT_OUTPUT_MODES[activeKey] || 'source';

  useEffect(() => {
    if (!isDragging) return;

    function handlePointerMove(event) {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const percent = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(15, Math.min(85, Math.round(percent * 10) / 10));
      setSplitRatio(clamped);
    }

    function handlePointerUp() {
      setIsDragging(false);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (maximizedPanel) setMaximizedPanel(null);
        if (isFullWindow) setIsFullWindow(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maximizedPanel, isFullWindow]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    function restorePageFromHistory() {
      const page = getSeoPage(window.location.pathname);
      setToolMode(page.toolMode || 'format');
      setFormat(page.format || 'json');
      setMaximizedPanel(null);
      setIsFullWindow(false);
      updatePageMetadata(page);
    }

    window.addEventListener('popstate', restorePageFromHistory);
    updatePageMetadata(initialPage);
    return () => window.removeEventListener('popstate', restorePageFromHistory);
  }, []);

  // Debounced auto-formatting while typing
  useEffect(() => {
    if (!content.trim()) return;
    const timer = setTimeout(() => {
      processDocument(content, format, toolMode, true);
    }, 450);
    return () => clearTimeout(timer);
  }, [content, format, toolMode]);

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
    setTabDocs((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        content: value,
        ...(value.trim() ? {} : { result: null, error: '', notice: '' }),
      },
    }));
  }

  function handlePaste(event) {
    const pasted = event.clipboardData?.getData('text');
    if (typeof pasted === 'string') {
      event.preventDefault();
      setTabDocs((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          content: pasted,
          ...(pasted.trim() ? {} : { result: null, error: '', notice: '' }),
        },
      }));
      if (pasted.trim()) {
        processDocument(pasted, format, toolMode, false);
      }
    }
  }

  function loadSample() {
    const sample = SAMPLES[activeKey];
    if (!sample) return;
    setTabDocs((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        content: sample,
      },
    }));
    processDocument(sample, format, toolMode, false);
    setTabDocs((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        notice: `Loaded ${toolDetails.label} sample`,
      },
    }));
  }

  function clearInput() {
    setTabDocs((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        content: '',
        result: null,
        error: '',
        notice: 'Input and result cleared',
        fileName: isFormatter ? `untitled.${activeFormat.extension}` : DEFAULT_FILENAMES[activeKey],
      },
    }));
  }

  function handleEditorKeyDown(event) {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      processDocument();
    } else if (event.shiftKey && event.key.toLowerCase() === 'x') {
      event.preventDefault();
      clearInput();
    }
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('format-studio-theme', nextTheme);
    } catch {
      setTabDocs((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          error: 'Theme changed, but this browser could not save your preference.',
        },
      }));
    }
  }

  function selectFormat(nextFormat) {
    const page = getFormatPage(nextFormat);
    if (page) navigateToPage(page);
    setToolMode('format');
    setFormat(nextFormat);
    setMaximizedPanel(null);
  }

  function selectTool(nextTool) {
    const page = getToolPage(nextTool);
    if (page) navigateToPage(page);
    setToolMode(nextTool);
    setMaximizedPanel(null);
    setIsFullWindow(false);
  }

  function setDocOutputMode(mode) {
    setTabDocs((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        outputMode: mode,
      },
    }));
  }

  function updateFileName(name) {
    setTabDocs((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        fileName: name,
      },
    }));
  }

  async function processDocument(customContent, customFormat = format, customToolMode = toolMode, isSilent = false) {
    const targetKey = customToolMode === 'format' ? customFormat : customToolMode;
    const textToProcess = typeof customContent === 'string' ? customContent : (tabDocs[targetKey]?.content ?? content);

    if (!isSilent) {
      setTabDocs((prev) => ({
        ...prev,
        [targetKey]: {
          ...prev[targetKey],
          error: '',
          notice: '',
        },
      }));
    }

    if (!textToProcess.trim() && !(customToolMode === 'jwtDecode' && jwtAction === 'encode')) {
      setTabDocs((prev) => ({
        ...prev,
        [targetKey]: {
          ...prev[targetKey],
          result: null,
        },
      }));
      return;
    }

    const currentBytes = new TextEncoder().encode(textToProcess).length;
    if (currentBytes > MAX_BYTES) {
      if (!isSilent) {
        setTabDocs((prev) => ({
          ...prev,
          [targetKey]: {
            ...prev[targetKey],
            error: 'This input is over the 1 MiB limit.',
          },
        }));
      }
      return;
    }

    setBusy(true);
    setExpandedNodes({});
    try {
      const nextResult = await processLocally({
        toolMode: customToolMode,
        format: customFormat,
        content: textToProcess,
        fileName: tabDocs[targetKey]?.fileName || fileName,
        jwtAction,
        jwtHeader,
        jwtKey,
        jwtOptions: { base64UrlSecret: jwtBase64UrlSecret, expectedIssuer, expectedAudience },
      });

      const defaultMode = customToolMode === 'format'
        ? (customFormat === 'html' || customFormat === 'markdown'
          ? 'preview'
          : customFormat === 'json' || customFormat === 'xml' ? 'tree' : 'source')
        : 'source';

      setTabDocs((prev) => ({
        ...prev,
        [targetKey]: {
          ...prev[targetKey],
          result: nextResult,
          outputMode: prev[targetKey]?.outputMode || defaultMode,
          notice: customToolMode === 'jwtDecode' && jwtAction === 'encode' ? 'JWT signed locally' : `${toolDetails.label} complete`,
          error: '',
        },
      }));
    } catch (processingError) {
      if (!isSilent) {
        setTabDocs((prev) => ({
          ...prev,
          [targetKey]: {
            ...prev[targetKey],
            error: processingError instanceof Error ? processingError.message : 'Could not process this input.',
          },
        }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyOutput() {
    if (!result) return;
    const value = outputMode === 'preview' ? result.previewHtml : result.formattedContent;
    try {
      await navigator.clipboard.writeText(value);
      setTabDocs((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          notice: outputMode === 'preview' ? 'Preview markup copied' : isFormatter ? 'Formatted source copied' : 'Result copied',
        },
      }));
    } catch {
      setTabDocs((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          error: 'Clipboard access is unavailable in this browser.',
        },
      }));
    }
  }

  function downloadOutput() {
    if (!result) return;
    try {
      const blob = new Blob([result.formattedContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = result.fileName || fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setTabDocs((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          notice: 'Download started',
        },
      }));
    } catch (downloadError) {
      setTabDocs((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          error: downloadError instanceof Error ? `Could not start the download: ${downloadError.message}` : 'Could not start the download.',
        },
      }));
    }
  }

  async function loadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const matchingFormat = FORMATS.find((item) => item.extension === extension
      || (item.id === 'markdown' && extension === 'markdown')
      || (item.id === 'yaml' && extension === 'yml'));
    if (!matchingFormat) {
      setTabDocs((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          error: 'Choose a JSON, HTML, XML, YAML, or Markdown file.',
        },
      }));
      event.target.value = '';
      return;
    }
    try {
      const fileContent = await file.text();
      setFormat(matchingFormat.id);
      setToolMode('format');
      const page = getFormatPage(matchingFormat.id);
      if (page) navigateToPage(page);

      const defaultMode = matchingFormat.id === 'html' || matchingFormat.id === 'markdown'
        ? 'preview'
        : matchingFormat.id === 'json' || matchingFormat.id === 'xml' ? 'tree' : 'source';

      setTabDocs((prev) => ({
        ...prev,
        [matchingFormat.id]: {
          content: fileContent,
          fileName: file.name,
          result: null,
          error: '',
          notice: `Loaded ${file.name}`,
          outputMode: defaultMode,
        },
      }));
      processDocument(fileContent, matchingFormat.id, 'format', false);
    } catch (fileError) {
      setTabDocs((prev) => ({
        ...prev,
        [matchingFormat.id]: {
          ...prev[matchingFormat.id],
          error: fileError instanceof Error ? `Could not read the selected file: ${fileError.message}` : 'Could not read the selected file.',
        },
      }));
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
      setTabDocs((prev) => ({
        ...prev,
        jwtDecode: {
          content: signed.formattedContent,
          result: inspected,
          fileName: 'decoded-jwt.json',
          error: '',
          notice: 'Verified example loaded. Its secret is public and for demos only.',
          outputMode: 'source',
        },
      }));
    } catch (exampleError) {
      setTabDocs((prev) => ({
        ...prev,
        jwtDecode: {
          ...prev.jwtDecode,
          error: exampleError instanceof Error ? exampleError.message : 'Could not generate the JWT example.',
        },
      }));
    } finally {
      setBusy(false);
    }
  }

  function changeJwtAction(nextAction) {
    if (result?.jwtInfo) {
      if (nextAction === 'encode' && jwtAction === 'decode') {
        const newContent = JSON.stringify(result.jwtInfo.payload, null, 2);
        setJwtHeader(JSON.stringify(result.jwtInfo.header, null, 2));
        setTabDocs((prev) => ({
          ...prev,
          jwtDecode: {
            ...prev.jwtDecode,
            content: newContent,
            result: null,
            error: '',
            outputMode: 'source',
          },
        }));
      } else if (nextAction === 'decode' && jwtAction === 'encode') {
        setTabDocs((prev) => ({
          ...prev,
          jwtDecode: {
            ...prev.jwtDecode,
            content: result.formattedContent,
            result: null,
            error: '',
            outputMode: 'source',
          },
        }));
      }
    } else {
      setTabDocs((prev) => ({
        ...prev,
        jwtDecode: {
          ...prev.jwtDecode,
          result: null,
          error: '',
          outputMode: 'source',
        },
      }));
    }
    setJwtAction(nextAction);
  }

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark-mode' : ''} ${isFullWindow ? 'full-window-mode' : ''}`} data-theme={theme}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Format Studio home">
          <span className="brand-mark"><Braces size={15} strokeWidth={2.2} /></span>
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
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      <main className="workspace">
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
          <span className="tabs-spacer" />
          <button
            className={`subtle-action fullscreen-action ${isFullWindow ? 'active' : ''}`}
            type="button"
            onClick={() => setIsFullWindow((current) => !current)}
            title={isFullWindow ? 'Exit full screen (Esc)' : 'Expand to full screen (100% viewport)'}
          >
            {isFullWindow ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullWindow ? 'Exit full screen' : 'Full screen'}</span>
          </button>
          <button className="subtle-action upload-action" type="button" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={15} /><span>Open file</span>
          </button>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept=".json,.html,.htm,.xml,.md,.markdown,.yaml,.yml" onChange={loadFile} />
        </nav>

        <section
          ref={gridRef}
          className={`editor-grid ${isDragging ? 'is-resizing' : ''} ${maximizedPanel === 'input' ? 'maximized-input' : ''} ${maximizedPanel === 'output' ? 'maximized-output' : ''}`}
          style={maximizedPanel ? undefined : { gridTemplateColumns: `minmax(140px, ${splitRatio}fr) 12px minmax(140px, ${100 - splitRatio}fr)` }}
          aria-label={toolDetails.label}
        >
          <article className="editor-panel input-panel">
            <div className="panel-heading">
              <div className="panel-title-group">
                <span className="panel-index">01</span>
                <h2>Input</h2>
                <span className="panel-caption">{isFormatter ? 'Paste or write your document' : toolDetails.label}</span>
              </div>
              <div className="panel-tools">
                <button
                  className={`icon-button ${wordWrap ? 'active-icon' : ''}`}
                  type="button"
                  aria-label={wordWrap ? 'Disable word wrap (enable horizontal scroll)' : 'Enable word wrap'}
                  title={wordWrap ? 'Word wrap: ON (click for horizontal scroll)' : 'Word wrap: OFF (click to wrap lines)'}
                  onClick={() => setWordWrap((current) => !current)}
                >
                  <WrapText size={15} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={maximizedPanel === 'input' ? 'Restore split view (Esc)' : 'Maximize input to 100% width'}
                  title={maximizedPanel === 'input' ? 'Restore split view (Esc)' : 'Maximize input to 100% width'}
                  onClick={() => setMaximizedPanel((current) => current === 'input' ? null : 'input')}
                >
                  {maximizedPanel === 'input' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button className="icon-button" type="button" aria-label="Clear input and result" aria-keyshortcuts="Control+Shift+X Meta+Shift+X" title="Clear input and result (Ctrl/⌘+Shift+X)" onClick={clearInput} disabled={!content}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="document-bar">
              {isFormatter
                ? <div className="filename-wrap"><FileJson size={15} /><input aria-label="Document filename" value={fileName} onChange={(event) => updateFileName(event.target.value)} /></div>
                : <span className="utility-input-label">{toolDetails.input}</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" className="subtle-action" onClick={loadSample} title={`Load sample ${toolDetails.label}`}>Sample</button>
                <span className="format-chip">{isFormatter ? activeFormat.label : toolMode === 'jwtDecode' ? 'JWT' : 'BASE64 URL'}</span>
              </div>
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
              className={`code-input ${wordWrap ? 'wrap' : 'nowrap'}`}
              wrap={wordWrap ? 'soft' : 'off'}
              spellCheck="false"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={toolDetails.placeholder}
              value={content}
              onChange={(event) => updateContent(event.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleEditorKeyDown}
              aria-keyshortcuts="Control+Enter Meta+Enter Control+Shift+X Meta+Shift+X"
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

          <div
            className={`process-rail ${isDragging ? 'dragging' : ''}`}
            onPointerDown={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDoubleClick={() => setSplitRatio(30)}
            title="Drag to resize (Double-click to reset to 30% / 70%)"
          >
            <div className="rail-handle" />
          </div>

          <article className="editor-panel output-panel">
            <div className="panel-heading output-heading">
              <div className="panel-title-group">
                <span className="panel-index">02</span>
                <h2>Result</h2>
                {result && <span className="success-label"><Check size={12} /> Ready</span>}
              </div>
              <div className="panel-tools output-tools">
                <button
                  className={`icon-button ${wordWrap ? 'active-icon' : ''}`}
                  type="button"
                  aria-label={wordWrap ? 'Disable word wrap (enable horizontal scroll)' : 'Enable word wrap'}
                  title={wordWrap ? 'Word wrap: ON (click for horizontal scroll)' : 'Word wrap: OFF (click to wrap lines)'}
                  onClick={() => setWordWrap((current) => !current)}
                >
                  <WrapText size={15} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={maximizedPanel === 'output' ? 'Restore split view (Esc)' : 'Maximize output to 100% width'}
                  title={maximizedPanel === 'output' ? 'Restore split view (Esc)' : 'Maximize output to 100% width'}
                  onClick={() => setMaximizedPanel((current) => current === 'output' ? null : 'output')}
                >
                  {maximizedPanel === 'output' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button className="icon-button" type="button" aria-label="Copy result" title="Copy result" onClick={copyOutput} disabled={!result}><Clipboard size={15} /></button>
                <button className="icon-button" type="button" aria-label="Download formatted file" title="Download formatted file" onClick={downloadOutput} disabled={!result}><Download size={15} /></button>
              </div>
            </div>
            <div className="result-bar">
              <div className="view-switch" role="tablist" aria-label="Result view">
                {supportsPreview && <button className={outputMode === 'preview' ? 'selected' : ''} type="button" role="tab" aria-selected={outputMode === 'preview'} onClick={() => setDocOutputMode('preview')}><PanelTop size={14} /> Preview</button>}
                <button className={outputMode === 'source' ? 'selected' : ''} type="button" role="tab" aria-selected={outputMode === 'source'} onClick={() => setDocOutputMode('source')}><Code2 size={14} /> Source</button>
                {supportsTree && <button className={outputMode === 'tree' ? 'selected' : ''} type="button" role="tab" aria-selected={outputMode === 'tree'} onClick={() => setDocOutputMode('tree')}><Braces size={14} /> Tree</button>}
                {toolMode === 'jwtDecode' && jwtAction === 'decode' && result?.jwtInfo && <button className={outputMode === 'claims' ? 'selected' : ''} type="button" role="tab" aria-selected={outputMode === 'claims'} onClick={() => setDocOutputMode('claims')}>Claims breakdown</button>}
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
                    <pre className={`code-output ${wordWrap ? 'wrap' : 'nowrap'}`}><code>{result.formattedContent}</code></pre>
                  </div>
                ) : supportsPreview && outputMode === 'preview' ? (
                  <iframe className="preview-frame" title={`${activeFormat.label} rendered preview`} sandbox="allow-scripts allow-same-origin allow-popups" srcDoc={getPreviewDocument(result.previewHtml, theme)} />
                ) : outputMode === 'tree' && supportsTree ? (
                  structuredTree.error ? (
                    <div className="tree-error">Could not display the tree: {structuredTree.error}. Switch to Source to view the formatted text.</div>
                  ) : (
                    <div className="structured-tree">
                      <TreeNode node={structuredTree.tree} expandedNodes={expandedNodes} setExpandedNodes={setExpandedNodes} />
                    </div>
                  )
                ) : (
                  <pre className={`code-output ${wordWrap ? 'wrap' : 'nowrap'}`}><code>{result.formattedContent}</code></pre>
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
          <span className="shortcut-hint"><kbd>Ctrl/⌘ + Enter</kbd> to run</span>
        </div>
        <div className="workspace-bottom"><span>JSON <i /> HTML <i /> XML <i /> MARKDOWN <i /> YAML</span><span>LOCAL INPUT <i /> NO FILES STORED</span></div>
      </main>
    </div>
  );
}

export default App;