// Vérification locale avec Chrome et les API Node natives ; aucune dépendance.
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function browser(width = 1360, height = 1000) {
  const target = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map(), errors = [], events = [];
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject, timeout } = pending.get(data.id);
      clearTimeout(timeout); pending.delete(data.id);
      if (data.error) reject(new Error(JSON.stringify(data.error))); else resolve(data.result);
    } else {
      events.push(data);
      if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails);
    }
  });
  function command(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error('Timeout: ' + method)); }, 30000);
      pending.set(id, { resolve, reject, timeout });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable');
  await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  async function evaluate(expression) {
    const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
    return result.result.value;
  }
  async function until(expression, ms = 30000) {
    const started = Date.now();
    while (Date.now() - started < ms) { if (await evaluate(expression)) return; await new Promise(r => setTimeout(r, 80)); }
    throw new Error('Condition non satisfaite: ' + expression);
  }
  async function navigate(path) {
    const marker = Date.now() + ':' + Math.random();
    await evaluate(`window.__navigationMarker = ${JSON.stringify(marker)}`);
    const url = 'http://127.0.0.1:4180/' + path;
    await command('Page.navigate', { url });
    await until(`window.__navigationMarker !== ${JSON.stringify(marker)} && location.href === ${JSON.stringify(url)} && document.readyState === "complete"`);
    await evaluate('document.fonts.ready.then(() => true)');
  }
  async function screenshot(path, selector) {
    let params = { format: 'png', captureBeyondViewport: true };
    if (selector) {
      const clip = await evaluate(`(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:Math.max(0,r.x+scrollX-8),y:Math.max(0,r.y+scrollY-8),width:Math.min(innerWidth,r.width+16),height:r.height+16,scale:1}; })()`);
      params.clip = clip;
    }
    // Une capture de composant exclut les éléments fixes qui lui sont extérieurs.
    if (selector) await evaluate(`window.__captureStyles = Array.from(document.querySelectorAll('.header,.progress')).filter(el => !document.querySelector(${JSON.stringify(selector)}).contains(el)).map(el => {const value=el.style.visibility;el.style.visibility='hidden';return [el,value]})`);
    try {
      const result = await command('Page.captureScreenshot', params);
      await writeFile(path, Buffer.from(result.data, 'base64'));
    } finally {
      if (selector) await evaluate('window.__captureStyles.forEach(([el,value])=>{el.style.visibility=value});delete window.__captureStyles');
    }
  }
  async function key(key) {
    const codes = { Tab: 9, Enter: 13, Escape: 27, ArrowLeft:37, ArrowUp:38, ArrowRight:39, ArrowDown:40, Home:36, End:35, ' ':32 };
    const printable = key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined;
    const event = { key, code:key === ' ' ? 'Space' : key, windowsVirtualKeyCode:codes[key] };
    await command('Input.dispatchKeyEvent', { type:'keyDown', ...event, ...(printable ? {text:printable, unmodifiedText:printable} : {}) });
    await command('Input.dispatchKeyEvent', { type:'keyUp', ...event });
  }
  async function close() { await command('Page.close'); ws.close(); }
  return { command, evaluate, until, navigate, screenshot, key, close, errors, events };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const page = await browser(Number(process.argv[3] || 1360));
  await page.navigate(process.argv[2] || 'cartes-restaurant.html');
  await page.evaluate('document.querySelector("[data-demo]")?.scrollIntoView({block:"center"})');
  await page.until('!document.querySelector("[data-demo]") || document.querySelector("[data-demo]").classList.contains("is-ready")');
  await page.screenshot('tools/.preview/current.png', '#demo');
  console.log(JSON.stringify({ errors: page.errors, overflow: await page.evaluate('document.documentElement.scrollWidth > innerWidth') }));
  await page.close();
}
