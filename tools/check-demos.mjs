// Vérifications locales des démos ; aucun envoi externe, aucune dépendance.
import assert from 'node:assert/strict';
import {browser} from './browser-check.mjs';
const pages=['cartes-restaurant','cartes-nfc','sites-internet','audit-marketing','applications','ia-automatisation','closing'];
const results=[];
const requested=process.argv.slice(2).join(' ');
async function test(name,run,width=390,height=844){if(requested&&!new RegExp(requested).test(name))return;const p=await browser(width,height);try{await p.command('Network.setCacheDisabled',{cacheDisabled:true});await run(p);assert.equal(p.errors.length,0,'Exception JS');assert.equal(p.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400).length,0,'Ressource manquante');console.log('OK',name);results.push(name);}finally{await p.close();}}
async function show(p,path){await p.navigate(path+'.html');await p.evaluate('document.querySelector("[data-demo]").scrollIntoView({block:"center",behavior:"instant"})');await p.until('document.querySelector("[data-demo]").classList.contains("is-ready")');}
async function fit(p){assert.ok(await p.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Débordement horizontal');}
async function activate(p,selector){await p.evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);await p.key('Enter');}
for(const path of pages){
 await test(path+' · mobile',async p=>{await show(p,path);if(await p.evaluate('!!document.querySelector("[data-demo=story]")'))await p.until('document.querySelector(".is-story-complete")');await fit(p);await p.screenshot('tools/.preview/'+path+'-final.png','#demo');},320);
 await test(path+' · sans JS',async p=>{await p.command('Emulation.setScriptExecutionDisabled',{value:true});await p.navigate(path+'.html');await fit(p);assert.ok(await p.evaluate('document.querySelector("[data-demo]").getBoundingClientRect().height>100'));assert.ok(await p.evaluate('Array.from(document.querySelectorAll("[data-demo-control]")).every(e=>!e.getClientRects().length)'));assert.ok(!await p.evaluate('document.querySelector("[data-demo]").classList.contains("is-ready")'));},320);
 await test(path+' · mouvement réduit',async p=>{await p.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await show(p,path);assert.ok(await p.evaluate('!document.querySelector("[data-demo=story]") || document.querySelector("[data-demo=story]").classList.contains("is-story-complete")'));if(path==='cartes-nfc')assert.ok(await p.evaluate('!document.querySelector("[data-nfc-contact]").hidden'));if(path==='cartes-restaurant'){await activate(p,'[data-dish=tartare][data-delta="1"]');await activate(p,'[data-send-order]');assert.ok(await p.evaluate('document.querySelector("[data-order-status]").textContent.includes("prête")'));}assert.ok(await p.evaluate('document.querySelector("[data-demo]").getAnimations({subtree:true}).filter(a=>a.playState==="running").length===0'),'Animation active en mouvement réduit');await fit(p);});
}
await test('Chargement différé et pause hors écran',async p=>{
 await p.navigate('closing.html');
 assert.equal(await p.evaluate('Array.from(document.scripts).some(s=>s.src.includes("/story.js"))'),false,'Script chargé avant démo visible');
 await p.evaluate('document.querySelector("[data-demo]").scrollIntoView({block:"center",behavior:"instant"})');await p.until('document.querySelector(".is-story-complete")');
 await activate(p,'[data-replay-story]');await p.evaluate('window.scrollTo({top:0,behavior:"instant"})');await p.until('document.querySelector("[data-demo]").dataset.visible==="false"');
 const before=await p.evaluate('Array.from(document.querySelectorAll("[data-seq]")).map(e=>e.className)');
 await p.evaluate('new Promise(resolve=>setTimeout(resolve,2200))');
 assert.deepEqual(await p.evaluate('Array.from(document.querySelectorAll("[data-seq]")).map(e=>e.className)'),before,'Animation hors écran');
 await p.evaluate('document.querySelector("[data-demo]").scrollIntoView({block:"center",behavior:"instant"})');await p.until('document.querySelector(".is-story-complete")');
 await activate(p,'[data-replay-story]');await p.command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await p.until('document.querySelector(".is-story-complete")');
},390,350);
await test('Audit : onglets, jauge et navigation clavier',async p=>{
 await show(p,'audit-marketing');
 assert.deepEqual(await p.evaluate('Array.from(document.querySelectorAll("[data-score]")).map(e=>e.textContent)'),['38','54','46','62']);
 assert.equal(await p.evaluate('document.querySelector("[data-gauge-number]").textContent'),'50');
 assert.equal(await p.evaluate('document.querySelector(\'[data-audit-panel="details"]\').hidden'),true);
 await activate(p,'[data-goto-tab="actions"]');
 assert.equal(await p.evaluate('document.querySelector(\'[data-audit-panel="actions"]\').hidden'),false);
 assert.equal(await p.evaluate('document.activeElement.dataset.auditTab'),'actions');
 await p.key('ArrowLeft');
 assert.equal(await p.evaluate('document.querySelector(\'[data-audit-tab="details"]\').getAttribute("aria-selected")'),'true');
 assert.equal(await p.evaluate('document.querySelector(\'[data-audit-panel="overview"]\').hidden'),true);
});
await test('Restaurant · commande au clavier puis devis',async p=>{
 await show(p,'cartes-restaurant');
 await activate(p,'[data-dish=tartare][data-delta="1"]');await p.key('Enter');await activate(p,'[data-dish=cocktail][data-delta="1"]');await activate(p,'[data-send-order]');
 assert.deepEqual(await p.evaluate('Array.from(document.querySelectorAll("[data-ticket-items] li")).map(e=>e.textContent)'),['2 × Tartare de bœuf','1 × Cocktail signature']);
 assert.ok(await p.evaluate('document.activeElement.dataset.restView==="kitchen"'));
 assert.ok(await p.evaluate('document.querySelector("[data-order-status]").textContent.includes("reçue")'));
 await p.until('document.querySelector("[data-order-status]").textContent.includes("préparation")');await p.until('document.querySelector("[data-order-status]").textContent.includes("prête")');
 const link=await p.evaluate('document.querySelector("[data-order-followup] a").getAttribute("href")');assert.equal(link,'contact.html?service=cartes-restaurant');
 await p.navigate(link);await p.until('document.querySelector("[data-quote-form]").classList.contains("is-enhanced")');assert.equal(await p.evaluate('document.querySelector("input[name=service]:checked").value'),'cartes-restaurant');assert.equal(await p.evaluate('Array.from(document.querySelectorAll("[data-quote-step]")).findIndex(e=>!e.hidden)'),1);
});
await test('NFC · recto-verso, contact et vCard',async p=>{
 await show(p,'cartes-nfc');await activate(p,'[data-nfc-card-trigger]');assert.ok(await p.evaluate('document.querySelector("[data-nfc-card]").classList.contains("is-flipped") && document.querySelector("[data-nfc-front]").inert'));
 await activate(p,'[data-nfc-tap]');await p.until('!document.querySelector("[data-nfc-contact]").hidden');
 // Capture le Blob sans déclencher de téléchargement sur le disque.
 await p.evaluate('window.__originalCreate=URL.createObjectURL;URL.createObjectURL=function(blob){window.__vcard=blob;return window.__originalCreate(blob)};document.addEventListener("click",e=>{if(e.target.matches("a[download]"))e.preventDefault()},true)');
 await activate(p,'[data-nfc-save]');const card=await p.evaluate('window.__vcard.text()');assert.ok(card.includes('FN:Benjamin Ikhmim\r\n')&&card.includes('EMAIL;TYPE=INTERNET:contact@ben-web.com')&&card.includes('TEL;TYPE=CELL:+66970499155'));
});
await test('Sites · quatre styles, clavier et langue locale',async p=>{
 await show(p,'sites-internet');assert.equal(await p.evaluate('document.querySelectorAll("[data-site-panel]").length'),1);
 for(const style of ['restaurant','avocat','sport','tourism']){await activate(p,`[data-site-select=${style}]`);assert.equal(await p.evaluate('document.querySelector("[data-site-panel]:not([hidden])").dataset.sitePanel'),style);await activate(p,`[data-site-panel=${style}] summary`);assert.ok(await p.evaluate(`document.querySelector('[data-site-panel=${style}] details').open`));await fit(p);}
 await p.evaluate('document.querySelector("[data-site-select=restaurant]").focus()');await p.key('End');assert.equal(await p.evaluate('document.activeElement.dataset.siteSelect'),'tourism');
 await activate(p,'[data-site-language=en]');assert.equal(await p.evaluate('document.querySelector("[data-site-panel=tourism]").lang'),'en');assert.equal(await p.evaluate('document.documentElement.lang'),'fr');
},320);
await test('Application · filtres et traitement au clavier',async p=>{
 await show(p,'applications');await activate(p,'[data-app-filter=pending]');assert.equal(await p.evaluate('document.querySelectorAll("[data-app-record]:not([hidden])").length'),2);
 await activate(p,'[data-app-complete]');assert.equal(await p.evaluate('document.querySelector("[data-app-count]").textContent'),'1 à traiter · 2 terminés');assert.equal(await p.evaluate('document.activeElement.dataset.appFilter'),'pending');
 await activate(p,'[data-app-record]:not([hidden]) [data-app-complete]');assert.ok(await p.evaluate('!document.querySelector("[data-app-empty]").hidden'));await activate(p,'[data-app-filter=done]');assert.equal(await p.evaluate('document.querySelectorAll("[data-app-record]:not([hidden])").length'),3);
});
console.log(results.length+' scénarios validés.');
