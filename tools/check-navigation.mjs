import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { browser } from './browser-check.mjs';

const results = [];
const requested = process.argv.slice(2).join(' ');
const evaluate = (page, fn, ...args) => page.evaluate('(' + fn.toString() + ')(' + args.map(v => JSON.stringify(v)).join(',') + ')');
async function test(name, width, height, run) {
  if (requested && !name.includes(requested)) return;
  const page = await browser(width, height);
  const originalUntil = page.until;
  page.until = (expression, ms = 30000) => originalUntil(expression, ms);
  try {
    await page.command('Emulation.setFocusEmulationEnabled', { enabled: true });
    const details = await run(page);
    assert.equal(page.errors.length, 0, 'Aucune exception JavaScript attendue');
    results.push({ name, status: 'pass', ...details });
  } catch (error) {
    console.error(error.stack);
    results.push({ name, status: 'fail', error: error.stack, exceptions: page.errors });
  } finally {
    console.error(results.at(-1)?.status + ' ' + name);
    await page.close();
  }
}
async function captureViewport(page, path) {
  const { data } = await page.command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(path, Buffer.from(data, 'base64'));
}
async function keyboardFocus(page, selector) {
  for (let index = 0; index < 20; index++) {
    if (await evaluate(page, s => document.activeElement.matches(s), selector)) return;
    await page.key('Tab');
  }
  assert.fail('Élément inaccessible par Tab : ' + selector);
}
async function shiftTab(page) {
  for (const type of ['keyDown', 'keyUp']) {
    await page.command('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', modifiers: 8, windowsVirtualKeyCode: 9 });
  }
}
async function assertNoOverflow(page) {
  const geometry = await evaluate(page, () => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(geometry.document <= geometry.viewport, JSON.stringify(geometry));
  return geometry;
}
const focusStyle = () => {
  const e = document.activeElement, s = getComputedStyle(e), r = e.getBoundingClientRect();
  return { visible: e.matches(':focus-visible'), outline: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor, top: r.top, bottom: r.bottom };
};

for (const path of ['index.html', 'infos.html']) {
  await test('Desktop clavier ' + path, 1360, 1000, async page => {
    await page.navigate(path);
    assert.ok(await evaluate(page, () => Array.from(document.styleSheets).some(s => s.href?.includes('/accessibility.css')) && Array.from(document.scripts).some(s => s.src.includes('/main.js'))));
    await keyboardFocus(page, '.nav-drop-btn');
    const buttonFocus = await evaluate(page, focusStyle);
    assert.ok(buttonFocus.visible && buttonFocus.outline === 'solid' && parseFloat(buttonFocus.width) >= 2);
    await page.key('Enter');
    await page.until("document.querySelector('.nav-drop-btn').getAttribute('aria-expanded') === 'true' && getComputedStyle(document.querySelector('.nav-menu')).opacity === '1'");
    await page.key('Tab');
    assert.ok(await evaluate(page, () => document.activeElement === document.querySelector('.nav-menu a')));
    await captureViewport(page, 'tools/.preview/navigation-desktop-' + path.replace('.html', '') + '.png');
    await page.key('Escape');
    assert.ok(await evaluate(page, () => document.activeElement.matches('.nav-drop-btn') && document.activeElement.getAttribute('aria-expanded') === 'false'));
    await evaluate(page, () => { document.activeElement.blur(); window.scrollTo({ top: 650, behavior: 'instant' }); });
    await page.until("document.querySelector('#header').classList.contains('is-hidden')");
    await evaluate(page, () => document.querySelector('.nav-drop-btn').focus({ preventScroll: true }));
    await page.until("!document.querySelector('#header').classList.contains('is-hidden') && document.querySelector('#header').getBoundingClientRect().top >= -1");
    const headerFocus = await evaluate(page, focusStyle);
    assert.ok(headerFocus.visible && headerFocus.top >= 0 && headerFocus.bottom <= 1000);
    if (path === 'infos.html') {
      await evaluate(page, () => { document.querySelector('.faq-q').scrollIntoView({ block: 'center', behavior: 'instant' }); document.querySelector('.faq-q').focus(); });
      await page.key('Enter');
      await page.until("document.querySelector('.faq-q').getAttribute('aria-expanded') === 'true' && !document.querySelector('.faq-a').hidden && document.querySelector('.faq-a').getBoundingClientRect().height > 20");
      await page.key('Enter');
      assert.ok(await evaluate(page, () => document.querySelector('.faq-a').hidden && document.querySelector('.faq-q').getAttribute('aria-expanded') === 'false'));
    }
    return { buttonFocus, headerFocus, geometry: await assertNoOverflow(page) };
  });

  for (const [width, height] of [[390, 844], [320, 568], [390, 320]]) {
    await test('Mobile ' + width + '×' + height + ' ' + path, width, height, async page => {
      await page.navigate(path);
      await assertNoOverflow(page);
      await keyboardFocus(page, '.nav-toggle');
      await page.key('Enter');
      await page.until("document.querySelector('#mobile-panel').classList.contains('is-open') && document.activeElement === document.querySelector('#mobile-panel a')");
      await page.until("Array.from(document.querySelectorAll('#mobile-panel nav a')).every(a=>getComputedStyle(a).opacity === '1')");
      assert.ok(await evaluate(page, () => document.querySelector('main').inert && document.querySelector('footer').inert && document.body.style.overflow === 'hidden'));
      const firstFocus = await evaluate(page, focusStyle);
      assert.ok(firstFocus.visible && firstFocus.outline === 'solid');
      if (width === 320) await captureViewport(page, 'tools/.preview/navigation-mobile320-' + path.replace('.html', '') + '.png');
      const controls = await evaluate(page, () => document.querySelectorAll('#mobile-panel a[href], #mobile-panel button:not([disabled]), #mobile-panel [tabindex="0"]').length);
      for (let i = 0; i < controls - 1; i++) await page.key('Tab');
      assert.ok(await evaluate(page, () => document.activeElement === Array.from(document.querySelectorAll('#mobile-panel a[href]')).at(-1)));
      const scroll = await evaluate(page, () => {
        const p = document.querySelector('#mobile-panel'), r = document.activeElement.getBoundingClientRect();
        return { scrollTop: p.scrollTop, scrollHeight: p.scrollHeight, clientHeight: p.clientHeight, focusedTop: r.top, focusedBottom: r.bottom };
      });
      assert.ok(scroll.focusedTop >= 0 && scroll.focusedBottom <= height + 1, JSON.stringify(scroll));
      if (scroll.scrollHeight > scroll.clientHeight) assert.ok(scroll.scrollTop > 0);
      await page.key('Tab');
      assert.ok(await evaluate(page, () => document.activeElement.matches('.nav-toggle')));
      await page.key('Tab');
      assert.ok(await evaluate(page, () => document.activeElement === document.querySelector('#mobile-panel a')));
      await shiftTab(page);
      assert.ok(await evaluate(page, () => document.activeElement.matches('.nav-toggle')));
      await shiftTab(page);
      assert.ok(await evaluate(page, () => document.activeElement === Array.from(document.querySelectorAll('#mobile-panel a[href]')).at(-1)));
      await page.key('Escape');
      await page.until("document.querySelector('#mobile-panel').hidden");
      assert.ok(await evaluate(page, () => document.activeElement.matches('.nav-toggle') && document.activeElement.getAttribute('aria-expanded') === 'false' && !document.querySelector('main').inert && !document.querySelector('footer').inert && document.body.style.overflow === ''));
      return { controls, firstFocus, scroll, geometry: await assertNoOverflow(page) };
    });
  }

  for (const width of [1360, 320]) {
    await test('Sans JavaScript ' + width + 'px ' + path, width, 800, async page => {
      await page.command('Emulation.setScriptExecutionDisabled', { value: true });
      await page.navigate(path);
      assert.ok(await evaluate(page, () => !document.documentElement.classList.contains('js')));
      const visible = await evaluate(page, () => Array.from(document.querySelectorAll('[data-reveal]')).map(e => ({ opacity: getComputedStyle(e).opacity, transform: getComputedStyle(e).transform, height: e.getBoundingClientRect().height })));
      assert.ok(visible.length > 0 && visible.every(e => e.opacity === '1' && e.transform === 'none' && e.height > 0));
      const nav = await evaluate(page, selector => {
        const e = document.querySelector(selector);
        return { display: getComputedStyle(e).display, visibility: getComputedStyle(e).visibility, height: e.getBoundingClientRect().height, inert: e.inert };
      }, width < 861 ? '#mobile-panel' : '.nav-services-fallback');
      assert.ok(nav.display !== 'none' && nav.visibility === 'visible' && nav.height > 0 && !nav.inert, JSON.stringify(nav));
      if (width === 320) await captureViewport(page, 'tools/.preview/navigation-nojs-menu320-' + path.replace('.html', '') + '.png');
      let faq;
      if (path === 'infos.html') {
        faq = await evaluate(page, () => Array.from(document.querySelectorAll('.faq-a')).map(e => ({ height: e.getBoundingClientRect().height, content: e.querySelector('p').getBoundingClientRect().height, hidden: e.hidden })));
        assert.ok(faq.length === 7 && faq.every(e => !e.hidden && e.height >= e.content && e.height > 0), JSON.stringify(faq));
        assert.ok(await evaluate(page, () => Array.from(document.querySelectorAll('.faq-q')).every(e => e.getAttribute('aria-expanded') === 'true')), 'Sans JS, les réponses visibles doivent être annoncées comme ouvertes');
        await evaluate(page, () => document.querySelector('#faq').scrollIntoView({ block: 'start', behavior: 'instant' }));
        await captureViewport(page, 'tools/.preview/navigation-nojs-faq-' + width + '.png');
      }
      return { reveals: visible.length, nav, faq, geometry: await assertNoOverflow(page) };
    });
  }
}

await test('Contrastes palette', 1360, 1000, async page => {
  await page.navigate('infos.html');
  const tokens = await evaluate(page, () => {
    const s = getComputedStyle(document.documentElement);
    return Object.fromEntries(['ink', 'ink-2', 'surface', 'surface-2', 'text', 'muted', 'muted-2', 'paper', 'paper-2', 'paper-text', 'paper-muted', 'accent', 'accent-ink'].map(k => [k, s.getPropertyValue('--' + k).trim()]));
  });
  function luminance(hex) {
    const c = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  const pairs = [];
  for (const background of ['ink', 'ink-2', 'surface', 'surface-2']) for (const color of ['text', 'muted', 'muted-2']) pairs.push([color, background]);
  for (const background of ['paper', 'paper-2']) for (const color of ['paper-text', 'paper-muted']) pairs.push([color, background]);
  pairs.push(['accent-ink', 'accent']);
  const ratios = pairs.map(([color, background]) => {
    const a = luminance(tokens[color]), b = luminance(tokens[background]);
    return { color, background, ratio: Number(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2)) };
  });
  assert.ok(ratios.every(r => r.ratio >= 4.5), JSON.stringify(ratios.filter(r => r.ratio < 4.5)));
  return { tokens, minimum: ratios.reduce((a, b) => a.ratio < b.ratio ? a : b), ratios };
});

console.log(JSON.stringify(results, null, 2));
process.exitCode = results.some(r => r.status === 'fail') ? 1 : 0;
