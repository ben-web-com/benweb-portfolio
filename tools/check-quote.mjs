// Tests navigateur locaux du parcours devis. Aucun envoi vers un service externe.
// Prérequis : serveur statique :4180, Chrome CDP :9222, Node natif.
import assert from 'node:assert/strict';
import { browser } from './browser-check.mjs';

const origin = 'http://127.0.0.1:4180/';
const endpoint = 'https://formspree.io/f/mwlkgrjo';
const storageKey = 'ben-web.devis.v1';
const results = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function ready(page, path = 'contact.html') {
  await page.command('Network.setCacheDisabled', { cacheDisabled: true });
  await page.navigate(path);
  await page.until(`location.href === ${JSON.stringify(origin + path)} && document.querySelector('[data-quote-form].is-enhanced')`);
  await page.evaluate('document.fonts.ready.then(() => true)');
}

async function click(page, selector) {
  const point = await page.evaluate(`(async () => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('Élément introuvable : ' + ${JSON.stringify(selector)});
    el.scrollIntoView({block:'center', behavior:'instant'});
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const r = el.getBoundingClientRect();
    return {x:r.left+r.width/2, y:r.top+r.height/2};
  })()`);
  await page.command('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await page.command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await page.command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
}

function step(page) {
  return page.evaluate("document.querySelector('[data-quote-step]:not([hidden])').dataset.quoteStep");
}

async function type(page, selector, text) {
  await page.evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  await page.command('Input.insertText', { text });
}

async function capture(page, filename) {
  // Le crop doit partir du document, sans le header fixe déplacé par le défilement.
  await page.evaluate("document.activeElement.blur(); window.scrollTo({top:0, behavior:'instant'})");
  await pause(250);
  await page.screenshot(filename, '.quote-container');
}

async function waitPaused(page, count = 1) {
  const deadline = Date.now() + 7000;
  while (Date.now() < deadline) {
    const paused = page.events.filter(event => event.method === 'Fetch.requestPaused');
    if (paused.length >= count) return paused[count - 1].params;
    await pause(40);
  }
  throw new Error('Le POST simulé n’a pas été intercepté.');
}

const desktop = await browser(1360, 1000);
try {
  await desktop.command('Fetch.enable', { patterns: [{ urlPattern: 'https://formspree.io/*', requestStage: 'Request' }] });
  await ready(desktop);
  assert.equal(await step(desktop), 'service');
  await click(desktop, '[data-quote-next]');
  assert.equal(await step(desktop), 'service');
  assert.match(await desktop.evaluate("document.querySelector('[data-quote-error]').textContent"), /Choisissez/);
  assert.equal(await desktop.evaluate('document.activeElement.type'), 'radio');

  await desktop.key('ArrowRight');
  assert.equal(await step(desktop), 'service', 'Les flèches ne changent pas d’écran');
  assert.equal(await desktop.evaluate("document.querySelector('input[name=service]:checked').value"), 'sites-internet');
  await desktop.key('Enter');
  assert.equal(await step(desktop), 'activite');
  assert.equal(await desktop.evaluate('document.activeElement.tagName'), 'LEGEND');
  await click(desktop, '[data-quote-back]');
  assert.equal(await step(desktop), 'service');
  assert.equal(await desktop.evaluate("document.querySelector('input[name=service]:checked').value"), 'sites-internet');
  await click(desktop, 'label:has(input[value="cartes-restaurant"])');
  assert.equal(await step(desktop), 'activite', 'Le vrai clic souris avance');
  await click(desktop, 'label:has(input[name="activite"][value="restaurant"])');
  assert.equal(await step(desktop), 'situation');
  await click(desktop, 'label:has(input[value="depart"])');
  assert.equal(await step(desktop), 'delai');

  await desktop.evaluate('window.__quoteDocumentBeforeReload = true');
  await desktop.command('Page.reload');
  await desktop.until("!window.__quoteDocumentBeforeReload && document.readyState === 'complete' && document.querySelector('[data-quote-form].is-enhanced') && document.querySelector('[data-quote-step=delai]:not([hidden])')");
  assert.equal(await step(desktop), 'delai', 'Le rafraîchissement restaure la progression');
  assert.equal(await desktop.evaluate("document.querySelector('input[name=activite]:checked').value"), 'restaurant');
  await click(desktop, 'label:has(input[value="mois"])');
  assert.equal(await step(desktop), 'coordonnees');
  assert.equal(await desktop.evaluate("document.querySelectorAll('[data-quote-recap] > div').length"), 4);

  await click(desktop, '[data-quote-submit]');
  assert.equal(await desktop.evaluate('document.activeElement.id'), 'devis-nom');
  assert.equal(await desktop.evaluate("document.querySelectorAll('[aria-invalid=true]').length"), 2);
  await type(desktop, '#devis-nom', 'Test navigateur local');
  await type(desktop, '#devis-email', 'adresse-invalide');
  await click(desktop, '[data-quote-submit]');
  assert.equal(await desktop.evaluate('document.activeElement.id'), 'devis-email');
  assert.match(await desktop.evaluate("document.querySelector('#devis-email-error').textContent"), /adresse e-mail valide/);
  await desktop.evaluate("document.querySelector('#devis-email').value = ''");
  await type(desktop, '#devis-email', 'test@example.invalid');
  await type(desktop, '#devis-message', 'Vérification locale uniquement — aucune demande réelle.');
  assert.equal(await desktop.evaluate("document.querySelector('[data-quote-error]').textContent"), '');
  await capture(desktop, 'tools/.preview/quote-desktop.png');
  await click(desktop, '[data-quote-submit]');
  const failedRequest = await waitPaused(desktop);
  await desktop.command('Fetch.fulfillRequest', {
    requestId: failedRequest.requestId, responseCode: 429,
    responseHeaders: [{name:'Content-Type',value:'application/json'}, {name:'Access-Control-Allow-Origin',value:'*'}],
    body: Buffer.from(JSON.stringify({errors:[{message:'Quota de test atteint'}]})).toString('base64')
  });
  await desktop.until("document.querySelector('[data-quote-error]').textContent.includes('n’a pas pu être confirmé') && !document.querySelector('[data-quote-submit]').disabled");
  assert.equal(await desktop.evaluate("document.querySelector('#devis-nom').value"), 'Test navigateur local');
  assert.equal(await desktop.evaluate(`JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).fields.email`), 'test@example.invalid');
  assert.equal(await desktop.evaluate("document.querySelector('[data-quote-success]').hidden"), true);
  results.push('Desktop : vrai clic, clavier, retour, rechargement, validation et refus POST 429 simulé préservant les réponses.');

  await click(desktop, '[data-quote-submit]');
  const unexpected = await waitPaused(desktop, 2);
  await desktop.command('Fetch.fulfillRequest', {
    requestId: unexpected.requestId, responseCode: 200,
    responseHeaders: [{name:'Content-Type',value:'text/html'}, {name:'Access-Control-Allow-Origin',value:'*'}],
    body: Buffer.from('<html>Vérification requise</html>').toString('base64')
  });
  await desktop.until("document.querySelector('[data-quote-error]').textContent.includes('n’a pas pu être confirmé') && !document.querySelector('[data-quote-submit]').disabled");
  assert.equal(await desktop.evaluate("document.querySelector('[data-quote-success]').hidden"), true);
  assert.notEqual(await desktop.evaluate(`sessionStorage.getItem(${JSON.stringify(storageKey)})`), null);
  await click(desktop, '[data-quote-submit]');
  const request = await waitPaused(desktop, 3);
  assert.equal(request.request.method, 'POST');
  assert.equal(request.request.url, endpoint);
  const data = new URLSearchParams(request.request.postData);
  assert.equal(data.get('_gotcha'), '');
  assert.equal(data.get('service'), 'cartes-restaurant');
  assert.equal(data.get('activite'), 'restaurant');
  assert.equal(data.get('situation'), 'depart');
  assert.equal(data.get('delai'), 'mois');
  assert.equal(data.get('email'), 'test@example.invalid');
  assert.equal(data.size, 9);
  assert.equal(request.request.headers.Accept, 'application/json');
  assert.ok(request.request.headers['Content-Type'].startsWith('application/x-www-form-urlencoded'));
  await desktop.evaluate("document.querySelector('[data-quote-form]').requestSubmit(); document.querySelector('[data-quote-form]').requestSubmit()");
  await pause(150);
  assert.equal(desktop.events.filter(event => event.method === 'Fetch.requestPaused').length, 3, 'Un seul POST malgré des soumissions répétées');
  await desktop.command('Fetch.fulfillRequest', {
    requestId: request.requestId, responseCode: 200,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, {name:'Access-Control-Allow-Origin',value:'*'}],
    body: Buffer.from(JSON.stringify({ok:true})).toString('base64')
  });
  await desktop.until("!document.querySelector('[data-quote-success]').hidden");
  assert.equal(await desktop.evaluate(`sessionStorage.getItem(${JSON.stringify(storageKey)})`), null);
  assert.equal(await desktop.evaluate('document.activeElement.tagName'), 'H2');
  assert.equal(await desktop.evaluate("document.querySelector('[data-quote-form]').hidden"), true);
  assert.equal(desktop.errors.length, 0);
  results.push('Succès POST simulé par CDP : données exactes, honeypot vide, aucune requête extérieure, double envoi bloqué, confirmation et stockage effacé.');
} finally { await desktop.close(); }

for (const width of [320, 390]) {
  const page = await browser(width, 844);
  try {
    if (width === 390) await page.command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await ready(page, 'contact.html?service=cartes-restaurant');
    assert.equal(await step(page), 'activite', 'Service prérempli depuis la démonstration');
    assert.equal(await page.evaluate('document.documentElement.scrollWidth > innerWidth'), false, `Pas de débordement à ${width}px`);
    await click(page, 'label:has(input[name="activite"][value="restaurant"])');
    await click(page, 'label:has(input[value="reseaux"])');
    await click(page, 'label:has(input[value="urgent"])');
    assert.equal(await step(page), 'coordonnees');
    assert.equal(await page.evaluate('document.documentElement.scrollWidth > innerWidth'), false);
    if (width === 390) {
      assert.equal(await page.evaluate("getComputedStyle(document.querySelector('[data-quote-step]:not([hidden])')).animationName"), 'none');
    }
    assert.equal(await page.evaluate("[...document.querySelectorAll('.quote-field input')].every(el => el.getBoundingClientRect().height >= 44)"), true);
    await click(page, '[data-quote-reset]');
    assert.equal(await step(page), 'service');
    assert.equal(await page.evaluate("document.querySelectorAll('input:checked').length"), 0);
    assert.equal(await page.evaluate(`sessionStorage.getItem(${JSON.stringify(storageKey)})`), null);
    assert.equal(await page.evaluate('document.documentElement.scrollWidth > innerWidth'), false);
    const mobileCards = await page.evaluate("[...document.querySelectorAll('.quote-choice--service')].map(el => ({height:el.getBoundingClientRect().height, width:el.getBoundingClientRect().width}))");
    assert.ok(mobileCards.every(card => card.height >= 90 && card.height <= 105));
    assert.ok(mobileCards.every(card => card.width < (width / 2)));
    if (width === 390) await capture(page, 'tools/.preview/quote-mobile.png');
    assert.equal(page.errors.length, 0);
    results.push(`Mobile ${width}px : service prérempli, cartes cliquables, cinq écrans, champs tactiles, effacement et aucun débordement.`);
  } finally { await page.close(); }
}

const native = await browser(390, 844);
try {
  await native.command('Emulation.setScriptExecutionDisabled', { value: true });
  await native.navigate('contact.html');
  await native.until("location.pathname === '/contact.html' && document.querySelector('[data-quote-form]')");
  const staticForm = await native.evaluate(`(() => {
    const f = document.querySelector('[data-quote-form]');
    return {
      steps: [...f.querySelectorAll('fieldset')].filter(s => getComputedStyle(s).display !== 'none').length,
      legends: f.querySelectorAll('legend').length,
      name: f.name, method: f.method, action: f.action,
      honeypot: f.querySelector('.quote-honeypot input').name,
      submit: getComputedStyle(f.querySelector('[type=submit]')).display !== 'none',
      required: [...f.querySelectorAll('[required]')].map(f => f.name),
      noValidate: f.noValidate,
      overflow: document.documentElement.scrollWidth > innerWidth
    };
  })()`);
  assert.equal(staticForm.steps, 5);
  assert.equal(staticForm.legends, 5);
  assert.equal(staticForm.name, 'devis');
  assert.equal(staticForm.method, 'post');
  assert.equal(staticForm.action, endpoint);
  assert.equal(staticForm.honeypot, '_gotcha');
  assert.equal(staticForm.submit, true);
  assert.equal(staticForm.noValidate, false);
  assert.equal(staticForm.overflow, false);
  assert.deepEqual([...new Set(staticForm.required)], ['service', 'activite', 'situation', 'delai', 'nom', 'email']);
  results.push('Sans JavaScript : cinq fieldsets/legends visibles, validation native, bouton POST vers Formspree et honeypot présents.');
} finally { await native.close(); }

console.log(JSON.stringify({ status: 'OK', checks: results, limits: 'Requêtes Formspree interceptées localement ; aucun message externe envoyé par cette suite.' }, null, 2));
