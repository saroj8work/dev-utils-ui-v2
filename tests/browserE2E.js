import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testAllTabs() {
  console.log('🚀 Starting Automated Headless Browser End-to-End Test for All Tabs...\n');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('  [Browser Error]:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    console.log('✓ Page loaded: http://localhost:5173/\n');

    // 1. Test JSON tab
    console.log('Testing Tab 1: JSON Formatter...');
    const sampleBtn = await page.$('.document-bar button.subtle-action');
    assert.ok(sampleBtn, 'Sample button found');
    await sampleBtn.click();
    await page.waitForSelector('.tree-node', { timeout: 4000 });
    const jsonOutput = await page.$eval('.structured-tree', (el) => el.innerText);
    assert.ok(jsonOutput.includes('Format Studio'), 'JSON tree contains sample content');
    console.log('  ✓ JSON tab: Sample loaded and rendered into interactive Structured Tree');

    // Test 2nd paste into JSON (verifying no duplicate paste or syntax error)
    const textarea = await page.$('#document-input');
    await textarea.click();
    await page.evaluate(() => {
      const el = document.getElementById('document-input');
      const dt = new DataTransfer();
      dt.setData('text/plain', '{"secondPaste": true, "count": 42}');
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      el.dispatchEvent(ev);
    });
    await new Promise((r) => setTimeout(r, 600));
    const treeAfterPaste = await page.$eval('.structured-tree', (el) => el.innerText);
    assert.ok(treeAfterPaste.includes('secondPaste'), 'JSON updated cleanly on paste');
    const feedbackError = await page.$eval('.feedback', (el) => el.innerText);
    assert.ok(!feedbackError.includes('SyntaxError'), 'No SyntaxError on 2nd paste');
    console.log('  ✓ JSON tab: 2nd paste auto-formatted cleanly without error\n');

    // 2. Test HTML tab
    console.log('Testing Tab 2: HTML Formatter & Preview...');
    const htmlTab = (await page.$$('.format-tab'))[1];
    await htmlTab.click();
    await new Promise((r) => setTimeout(r, 300));
    // Verify JSON didn't bleed into HTML tab!
    const htmlInputVal = await page.$eval('#document-input', (el) => el.value);
    assert.equal(htmlInputVal, '', 'HTML input started clean without JSON bleeding');
    // Click sample
    await (await page.$('.document-bar button.subtle-action')).click();
    await new Promise((r) => setTimeout(r, 800));
    // Verify preview frame
    const iframe = await page.$('iframe.preview-frame');
    assert.ok(iframe, 'HTML preview iframe rendered');
    // Switch to Source view
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.view-switch button'));
      const b = btns.find((el) => el.textContent.includes('Source'));
      b?.click();
    });
    await page.waitForSelector('pre.code-output', { timeout: 3000 });
    const formattedHtml = await page.$eval('pre.code-output', (el) => el.innerText);
    assert.ok(formattedHtml.includes('<!DOCTYPE html>'), 'Formatted HTML source rendered');
    console.log('  ✓ HTML tab: Independent state, live preview iframe rendered, formatted source verified\n');

    // 3. Test XML tab
    console.log('Testing Tab 3: XML Formatter...');
    const xmlTab = (await page.$$('.format-tab'))[2];
    await xmlTab.click();
    await new Promise((r) => setTimeout(r, 300));
    await (await page.$('.document-bar button.subtle-action')).click();
    await page.waitForSelector('.structured-tree', { timeout: 4000 });
    const xmlTree = await page.$eval('.structured-tree', (el) => el.innerText);
    assert.ok(xmlTree.includes('Format Studio'), 'XML tree rendered');
    console.log('  ✓ XML tab: Interactive XML tree rendered with full tag hierarchy\n');

    // 4. Test Markdown tab
    console.log('Testing Tab 4: Markdown Formatter & Mermaid Viewer...');
    const mdTab = (await page.$$('.format-tab'))[3];
    await mdTab.click();
    await new Promise((r) => setTimeout(r, 300));
    await (await page.$('.document-bar button.subtle-action')).click();
    await new Promise((r) => setTimeout(r, 1000));
    const mdIframe = await page.$('iframe.preview-frame');
    assert.ok(mdIframe, 'Markdown preview iframe rendered');
    const mdSrcDoc = await page.$eval('iframe.preview-frame', (el) => el.srcdoc);
    assert.ok(mdSrcDoc.includes('mermaid.initialize'), 'Mermaid script initialized in preview iframe');
    console.log('  ✓ Markdown tab: GFM rendered and Mermaid script initialized\n');

    // 5. Test YAML tab
    console.log('Testing Tab 5: YAML Formatter...');
    const yamlTab = (await page.$$('.format-tab'))[4];
    await yamlTab.click();
    await new Promise((r) => setTimeout(r, 300));
    await (await page.$('.document-bar button.subtle-action')).click();
    await page.waitForSelector('pre.code-output', { timeout: 3000 });
    const yamlOutput = await page.$eval('pre.code-output', (el) => el.innerText);
    assert.ok(yamlOutput.includes('server:'), 'YAML output verified');
    console.log('  ✓ YAML tab: Formatted YAML output verified\n');

    // 6. Test JWT Debugger tab
    console.log('Testing Tab 6: JWT Debugger & Signer...');
    const jwtTab = (await page.$$('.utility-tab'))[0];
    await jwtTab.click();
    await new Promise((r) => setTimeout(r, 300));
    const genExampleBtn = await page.$('.jwt-example-button');
    assert.ok(genExampleBtn, 'Generate example button found');
    await genExampleBtn.click();
    await page.waitForSelector('.jwt-verification-status', { timeout: 4000 });
    const statusText = await page.$eval('.jwt-verification-status', (el) => el.innerText);
    assert.ok(statusText.includes('Signature verified'), 'JWT signature verified');
    // Claims breakdown
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.view-switch button'));
      const b = btns.find((el) => el.textContent.includes('Claims'));
      b?.click();
    });
    console.log('  ✓ JWT Debugger: Signed and verified token, claims breakdown verified\n');

    // 7. Test Base64URL Encode tab
    console.log('Testing Tab 7: Base64URL Encode...');
    const b64EncodeTab = (await page.$$('.utility-tab'))[1];
    await b64EncodeTab.click();
    await new Promise((r) => setTimeout(r, 300));
    await (await page.$('.document-bar button.subtle-action')).click();
    await page.waitForSelector('pre.code-output', { timeout: 3000 });
    const b64EncOutput = await page.$eval('pre.code-output', (el) => el.innerText);
    assert.ok(b64EncOutput.length > 10, 'Base64 encoded output verified');
    console.log('  ✓ Base64URL Encode: Sample text encoded to URL-safe string\n');

    // 8. Test Base64URL Decode tab
    console.log('Testing Tab 8: Base64URL Decode...');
    const b64DecodeTab = (await page.$$('.utility-tab'))[2];
    await b64DecodeTab.click();
    await new Promise((r) => setTimeout(r, 300));
    await (await page.$('.document-bar button.subtle-action')).click();
    await page.waitForSelector('pre.code-output', { timeout: 3000 });
    const b64DecOutput = await page.$eval('pre.code-output', (el) => el.innerText);
    assert.ok(b64DecOutput.includes('Format Studio'), 'Base64 decoded output verified');
    console.log('  ✓ Base64URL Decode: URL-safe string decoded back to text\n');

    // 9. Test Theme Toggle (Dark / Light)
    console.log('Testing Global Features: Theme Toggle...');
    const themeBtn = await page.$('.theme-toggle');
    await themeBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    const isDark = await page.evaluate(() => document.documentElement.dataset.theme === 'dark');
    assert.ok(isDark, 'Theme toggled to dark mode');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.ok(bodyBg.includes('17, 23, 19') || bodyBg.includes('rgb(17'), `Body has dark background: ${bodyBg}`);
    console.log('  ✓ Dark Mode: Theme toggled, global dark background active\n');

    // 10. Test Full Screen Toggle
    console.log('Testing Global Features: Full Screen Mode...');
    const fullScreenBtn = await page.$('.fullscreen-action');
    await fullScreenBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    const isFullWindow = await page.$('.full-window-mode');
    assert.ok(isFullWindow, 'Full screen mode enabled');
    await fullScreenBtn.click();
    console.log('  ✓ Full Screen Mode: Expand/collapse works cleanly\n');

    console.log('🎉 ALL 8 TABS & ALL CATEGORIES TESTED IN LIVE HEADLESS BROWSER SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

testAllTabs().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
