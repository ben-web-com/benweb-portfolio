/* Devis Formspree : HTML complet sans JS, parcours guidé avec JS. */
(() => {
  'use strict';

  const form = document.querySelector('[data-quote-form]');
  if (!form || !window.fetch || !window.FormData || !window.URLSearchParams) return;

  const storageKey = 'ben-web.devis.v1';
  const steps = Array.from(form.querySelectorAll('[data-quote-step]'));
  const progressWrap = document.querySelector('[data-quote-progress]');
  const progress = progressWrap.querySelector('progress');
  const stepLabel = progressWrap.querySelector('[data-quote-step-label]');
  const back = form.querySelector('[data-quote-back]');
  const next = form.querySelector('[data-quote-next]');
  const submit = form.querySelector('[data-quote-submit]');
  const error = form.querySelector('[data-quote-error]');
  const sendStatus = form.querySelector('[data-quote-send-status]');
  const recap = form.querySelector('[data-quote-recap]');
  const success = document.querySelector('[data-quote-success]');
  const names = ['service', 'activite', 'situation', 'delai', 'nom', 'email', 'telephone', 'message'];
  const questionNames = names.slice(0, 4);
  const recapLabels = ['Service', 'Activité', 'Situation', 'Délai'];
  let currentStep = 0;
  let sending = false;

  function save() {
    const fields = {};
    names.forEach(name => { fields[name] = form.elements.namedItem(name).value; });
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ step: currentStep, fields }));
    } catch (_) { /* Le parcours reste fonctionnel si le stockage est indisponible. */ }
  }

  function clearStored() {
    try { sessionStorage.removeItem(storageKey); } catch (_) { /* Navigation privée. */ }
  }

  function restore() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey));
      if (!stored || typeof stored.fields !== 'object' || !stored.fields) return;
      names.forEach(name => {
        const value = stored.fields[name];
        if (typeof value !== 'string') return;
        const field = form.elements.namedItem(name);
        if (questionNames.includes(name)) {
          Array.from(field).forEach(input => { input.checked = input.value === value; });
        } else {
          field.value = value.slice(0, field.maxLength > 0 ? field.maxLength : 4000);
        }
      });
      if (Number.isInteger(stored.step)) currentStep = Math.max(0, Math.min(steps.length - 1, stored.step));
    } catch (_) { /* Une ancienne valeur illisible n’empêche pas de remplir le devis. */ }
  }

  function clearErrors() {
    error.textContent = '';
    form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
    form.querySelectorAll('.quote-field-error').forEach(message => { message.textContent = ''; });
  }

  function updateRecap() {
    recap.replaceChildren();
    questionNames.forEach((name, index) => {
      const selected = steps[index].querySelector('input:checked');
      if (!selected) return;
      const row = document.createElement('div');
      const label = document.createElement('dt');
      const value = document.createElement('dd');
      label.textContent = recapLabels[index];
      value.textContent = selected.closest('label').querySelector('strong').textContent;
      row.append(label, value);
      recap.append(row);
    });
    recap.hidden = false;
  }

  function showStep(index, focus = true) {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    clearErrors();
    steps.forEach((step, i) => { step.hidden = i !== currentStep; });
    back.hidden = currentStep === 0;
    next.hidden = currentStep === steps.length - 1;
    submit.hidden = currentStep !== steps.length - 1;
    progress.value = currentStep + 1;
    progress.textContent = `${currentStep + 1} sur ${steps.length}`;
    stepLabel.textContent = `Étape ${currentStep + 1} sur ${steps.length}`;
    if (currentStep === steps.length - 1) updateRecap();
    save();
    if (focus) {
      const legend = steps[currentStep].querySelector('legend');
      legend.focus({ preventScroll: true });
      const rect = legend.getBoundingClientRect();
      if (rect.top < 100 || rect.bottom > window.innerHeight - 40) {
        legend.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }

  function validateStep(index) {
    clearErrors();
    const step = steps[index];
    if (index < questionNames.length) {
      if (step.querySelector('input:checked')) return true;
      error.textContent = 'Choisissez une carte pour continuer.';
      step.querySelector('input').focus();
      return false;
    }
    let firstInvalid = null;
    step.querySelectorAll('input, textarea').forEach(input => {
      if (input.name === 'nom') input.value = input.value.trim();
      if (input.name === 'email') input.value = input.value.trim();
      if (input.checkValidity()) return;
      input.setAttribute('aria-invalid', 'true');
      const message = document.getElementById(`${input.id}-error`);
      if (message) {
        message.textContent = input.name === 'email'
          ? 'Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.'
          : 'Indiquez votre nom.';
      }
      if (!firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      error.textContent = 'Vérifiez les champs indiqués pour envoyer votre demande.';
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function advance() {
    if (sending || currentStep >= steps.length - 1) return;
    if (validateStep(currentStep)) showStep(currentStep + 1);
  }

  restore();
  const serviceQuery = new URLSearchParams(window.location.search).get('service');
  const matchingService = Array.from(form.elements.namedItem('service')).find(input => input.value === serviceQuery);
  if (matchingService) {
    matchingService.checked = true;
    currentStep = Math.max(currentStep, 1);
  }
  // Une restauration ne doit jamais passer une question laissée sans réponse.
  for (let i = 0; i < currentStep; i += 1) {
    if (!steps[i].querySelector('input:checked')) { currentStep = i; break; }
  }

  back.addEventListener('click', () => { if (!sending) showStep(currentStep - 1); });
  next.addEventListener('click', advance);
  form.addEventListener('input', event => {
    save();
    const input = event.target;
    if (input.hasAttribute('aria-invalid')) {
      input.removeAttribute('aria-invalid');
      const message = document.getElementById(`${input.id}-error`);
      if (message) message.textContent = '';
      if (!form.querySelector('[aria-invalid]') && error.textContent.startsWith('Vérifiez les champs')) {
        error.textContent = '';
      }
    }
  });
  form.addEventListener('change', save);
  // Les flèches changent la radio sans déclencher de changement d’écran.
  // Le clic tactile/souris avance ; Entrée ou Continuer valide au clavier.
  form.addEventListener('click', event => {
    if (event.target.matches('input[type="radio"]') && event.detail > 0) advance();
  });
  form.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('input[type="radio"]')) {
      event.preventDefault();
      event.target.checked = true;
      advance();
    }
  });
  form.querySelector('[data-quote-reset]').addEventListener('click', () => {
    if (sending) return;
    form.reset();
    clearStored();
    showStep(0);
    clearStored();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    if (currentStep < steps.length - 1) { advance(); return; }
    for (let i = 0; i < steps.length; i += 1) {
      if (i < questionNames.length && !steps[i].querySelector('input:checked')) {
        showStep(i);
        validateStep(i);
        return;
      }
    }
    if (!validateStep(currentStep)) return;
    save();
    const body = new URLSearchParams(new FormData(form)).toString();
    sending = true;
    form.setAttribute('aria-busy', 'true');
    // Gèle les réponses après sérialisation : pas de doublon ni de modification perdue.
    const controls = Array.from(form.querySelectorAll('input, textarea, button'));
    controls.forEach(control => { control.disabled = true; });
    sendStatus.textContent = 'Envoi de votre demande…';
    submit.textContent = 'Envoi en cours…';
    const controller = window.AbortController ? new AbortController() : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), 20000) : null;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body,
        ...(controller ? { signal: controller.signal } : {})
      });
      if (!response.ok) throw new Error('Submission failed');
      const result = await response.json();
      if (result.ok !== true) throw new Error('Submission not confirmed');
      clearStored();
      form.hidden = true;
      progressWrap.hidden = true;
      success.hidden = false;
      success.querySelector('h2').focus();
    } catch (_) {
      error.textContent = 'L’envoi n’a pas pu être confirmé. Vos réponses sont conservées. Réessayez ou contactez-moi par e-mail ou WhatsApp juste en dessous.';
    } finally {
      if (timeout !== null) window.clearTimeout(timeout);
      sending = false;
      form.removeAttribute('aria-busy');
      controls.forEach(control => { control.disabled = false; });
      submit.textContent = 'Envoyer ma demande ↗';
      sendStatus.textContent = '';
      if (!form.hidden) submit.focus();
    }
  });

  // Activation en dernier : si l’initialisation échoue, le formulaire natif reste utilisable.
  form.noValidate = true;
  form.classList.add('is-enhanced');
  progressWrap.hidden = false;
  form.querySelector('[data-quote-save-note]').hidden = false;
  form.querySelectorAll('[data-quote-choice-help]').forEach(help => {
    help.hidden = false;
    help.closest('fieldset').setAttribute('aria-describedby', help.id);
  });
  showStep(currentStep, false);
})();
