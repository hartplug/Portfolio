// Deterministic, browser-only Automation Discovery Studio. No network, model, or storage calls.
const STAGES = [
  'PROBLEM',
  'CURRENT WORKFLOW',
  'TOOLS & CONSTRAINTS',
  'OUTCOMES & PRIORITIES',
  'ILLUSTRATIVE BRIEF',
  'REVIEW & INQUIRY',
];

const PROCESS_TEMPLATES = {
  'Customer enquiries': {
    questions: [
      { key: 'volume', label: 'About how many enquiries arrive each week?', type: 'number', min: 0, max: 100000 },
      { key: 'channels', label: 'Where do enquiries arrive?', type: 'text', max: 160, placeholder: 'Email, WhatsApp, web form…' },
      { key: 'record', label: 'Where is each enquiry recorded today?', type: 'text', max: 160, placeholder: 'Spreadsheet, CRM, inbox, or not consistently…' },
      { key: 'handoff', label: 'Who handles the next step?', type: 'text', max: 140, placeholder: 'Role or team; no names needed' },
    ],
    trigger: 'A new enquiry is received',
    actions: ['Capture agreed fields in one lead register', 'Check for missing details or possible duplicates', 'Route the enquiry to the agreed owner', 'Record status and follow-up outcome'],
    benefit: 'May reduce repeated copying and make follow-up status easier to see; no time saving has been measured.',
    risks: ['Customer-data access and consent', 'Duplicate or incomplete enquiries', 'Who owns follow-up and exceptions'],
  },
  'Document handling': {
    questions: [
      { key: 'volume', label: 'About how many documents are handled each week?', type: 'number', min: 0, max: 100000 },
      { key: 'documentTypes', label: 'Which document types are involved?', type: 'text', max: 160, placeholder: 'Invoices, forms, reports…' },
      { key: 'storage', label: 'Where are they stored now?', type: 'text', max: 160, placeholder: 'Email, shared drive, cloud folder…' },
      { key: 'review', label: 'Who checks or approves them?', type: 'text', max: 140, placeholder: 'Role or team; no names needed' },
    ],
    trigger: 'A document is received or uploaded',
    actions: ['Register the document and its source', 'Check required fields and expected document type', 'Route it to the appropriate reviewer', 'Record approval, correction, or exception'],
    benefit: 'May make document status and handoffs easier to track; accuracy and savings remain untested.',
    risks: ['Sensitive information and retention', 'Incorrect classification or extraction', 'Access permissions and human approval'],
  },
  'Scheduling and reminders': {
    questions: [
      { key: 'volume', label: 'About how many bookings or reminders occur each week?', type: 'number', min: 0, max: 100000 },
      { key: 'events', label: 'What is being scheduled?', type: 'text', max: 160, placeholder: 'Appointments, shifts, deliveries…' },
      { key: 'calendar', label: 'Where is the schedule kept?', type: 'text', max: 160, placeholder: 'Calendar, spreadsheet, messages…' },
      { key: 'owner', label: 'Who handles changes and missed reminders?', type: 'text', max: 140, placeholder: 'Role or team; no names needed' },
    ],
    trigger: 'A booking or due date is confirmed',
    actions: ['Check date, time, and required details', 'Create or update the agreed schedule entry', 'Send a reminder through an approved channel', 'Route changes or delivery failures to a person'],
    benefit: 'May make upcoming work more visible and reduce manual reminder steps; impact is not measured.',
    risks: ['Time-zone and date accuracy', 'Consent and notification preferences', 'Rescheduling and failed delivery handling'],
  },
  'Reporting and data entry': {
    questions: [
      { key: 'volume', label: 'About how many records or reports are processed each week?', type: 'number', min: 0, max: 100000 },
      { key: 'sources', label: 'Which sources provide the information?', type: 'text', max: 160, placeholder: 'Spreadsheets, forms, POS, messages…' },
      { key: 'destination', label: 'Where should the result end up?', type: 'text', max: 160, placeholder: 'Approved spreadsheet, CRM, report…' },
      { key: 'review', label: 'Who checks totals or exceptions?', type: 'text', max: 140, placeholder: 'Role or team; no names needed' },
    ],
    trigger: 'A new record or reporting period is ready',
    actions: ['Collect only agreed source fields', 'Validate required values and flag anomalies', 'Prepare the record or report in the chosen destination', 'Request human review before consequential updates'],
    benefit: 'May reduce repeat entry and make checks more consistent; no accuracy or time result is guaranteed.',
    risks: ['Source data quality and reconciliation', 'Access to business or financial records', 'Destination limits and approval requirements'],
  },
  'Other repetitive process': {
    questions: [
      { key: 'volume', label: 'About how often does this process happen each week?', type: 'number', min: 0, max: 100000 },
      { key: 'tools', label: 'Which tools or channels are involved?', type: 'text', max: 160, placeholder: 'List the tools or channels, if known' },
      { key: 'handoff', label: 'Who receives the next step?', type: 'text', max: 140, placeholder: 'Role or team; no names needed' },
      { key: 'exceptions', label: 'What commonly goes wrong or needs judgment?', type: 'text', max: 180, placeholder: 'Optional details that affect the workflow' },
    ],
    trigger: 'The process reaches its agreed starting point',
    actions: ['Capture only the information needed for the next step', 'Check required fields and obvious exceptions', 'Prepare a handoff to the appropriate owner', 'Record the status and route uncertain cases to a person'],
    benefit: 'May make a repetitive handoff more visible; benefit depends on the actual workflow and is unmeasured.',
    risks: ['Unclear process ownership or exception rules', 'Tool permissions and compatibility', 'Data quality and review responsibilities'],
  },
};

const state = {
  stage: 0,
  answers: {
    problem: { category: '', task: '', pain: '', frequency: '' },
    workflow: { currentSteps: '', bottleneck: '', exception: '' },
    tools: { systems: '', constraints: '', humanReview: '' },
    outcomes: { desired: '', priority: '', successSignal: '' },
  },
};

const stageList = document.querySelector('#stage-list');
const content = document.querySelector('#stage-content');
const feedback = document.querySelector('#feedback');
const backButton = document.querySelector('#back');
const continueButton = document.querySelector('#continue');
const restartButton = document.querySelector('#restart');
const clearButton = document.querySelector('#clear');
const nav = document.querySelector('.nav');
const clock = document.querySelector('#clock');
function updateClock() {
  if (clock) clock.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()) + ' WAT / ABUJA';
}
updateClock();
const clockTimer = setInterval(updateClock, 1000);
let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY;
  nav?.classList.toggle('scrolled', y > 40 && y >= lastY);
  if (y < 40) nav?.classList.remove('scrolled');
  lastY = y;
}, { passive: true });
window.addEventListener('pagehide', () => clearInterval(clockTimer), { once: true });

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function selectedTemplate() { return PROCESS_TEMPLATES[state.answers.problem.category] || PROCESS_TEMPLATES['Other repetitive process']; }
function answer(group, key) { return state.answers[group]?.[key] ?? ''; }
function setFeedback(message = '', tone = '') {
  feedback.textContent = message;
  feedback.className = `automation-feedback${tone ? ` ${tone}` : ''}`;
}
function field({ key, label, type = 'text', max = 180, min = 0, maxNumber = 100000, placeholder = '', options = [], required = false }, value = '') {
  const id = `automation-${key}`;
  const requiredText = required ? '<span aria-hidden="true"> *</span>' : '';
  let control;
  if (type === 'select') {
    control = `<select id="${id}" name="${key}" ${required ? 'required' : ''}><option value="">Choose one…</option>${options.map(option => `<option value="${escapeHtml(option)}" ${value === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`;
  } else if (type === 'textarea') {
    control = `<textarea id="${id}" name="${key}" maxlength="${max}" rows="3" placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''}>${escapeHtml(value)}</textarea>`;
  } else {
    control = `<input id="${id}" name="${key}" type="${type}" ${type === 'number' ? `min="${min}" max="${maxNumber}" step="1"` : `maxlength="${max}"`} value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''}>`;
  }
  return `<div class="automation-field"><label for="${id}">${escapeHtml(label)}${requiredText}</label>${control}<span class="automation-inline-error" id="error-${key}"></span></div>`;
}
function frame(index, title, lead, markup) {
  return `<p class="automation-stage-kicker">STAGE 0${index + 1} / 06 · ${STAGES[index]}</p><h2 class="automation-stage-title" tabindex="-1">${title}</h2><p class="automation-stage-lead">${lead}</p>${markup}`;
}
function isEmpty() { return Object.values(state.answers).every(group => Object.values(group).every(value => !String(value ?? '').trim())); }
function progress() {
  stageList.innerHTML = STAGES.map((name, index) => `<li class="${index === state.stage ? 'active' : index < state.stage ? 'complete' : ''}" ${index === state.stage ? 'aria-current="step"' : ''}><span class="automation-step-number">0${index + 1}</span>${escapeHtml(name)}</li>`).join('');
  backButton.disabled = state.stage === 0;
  continueButton.textContent = state.stage === 5 ? 'Restart session ↻' : state.stage === 4 ? 'Review inquiry →' : 'Continue →';
  clearButton.disabled = isEmpty();
}
function problemMarkup() {
  return `<div class="automation-field-grid">
    ${field({ key: 'category', label: 'Which process is closest?', type: 'select', options: Object.keys(PROCESS_TEMPLATES), required: true }, answer('problem', 'category'))}
    ${field({ key: 'task', label: 'What task repeats?', max: 180, placeholder: 'For example, copying order details into a tracker', required: true }, answer('problem', 'task'))}
    <div class="automation-field">${field({ key: 'pain', label: 'Where does time, effort, or accuracy get lost?', type: 'textarea', max: 280, placeholder: 'Describe what is frustrating or costly; avoid confidential details.', required: true }, answer('problem', 'pain'))}</div>
    ${field({ key: 'frequency', label: 'How often does it happen?', type: 'select', options: ['Several times a day', 'Daily', 'A few times a week', 'Weekly', 'Less often'], required: true }, answer('problem', 'frequency'))}
  </div>`;
}
function workflowMarkup() {
  return `<div class="automation-field-grid">
    <div class="automation-field full">${field({ key: 'currentSteps', label: 'What usually happens, from start to finish?', type: 'textarea', max: 500, placeholder: 'A few short steps are enough.', required: true }, answer('workflow', 'currentSteps'))}</div>
    ${field({ key: 'bottleneck', label: 'Where does work wait, repeat, or get missed?', max: 220, placeholder: 'Name the handoff or step, if known', required: true }, answer('workflow', 'bottleneck'))}
    ${field({ key: 'exception', label: 'What needs a person to decide or check?', max: 220, placeholder: 'Unknown is a valid answer', required: true }, answer('workflow', 'exception'))}
    <p class="automation-hint">Typical trigger to investigate: ${escapeHtml(selectedTemplate().trigger)}. This is a prompt, not an assumption about your process.</p>
  </div>`;
}
function toolsMarkup() {
  const template = selectedTemplate();
  return `<div class="automation-field-grid">
    ${field({ key: 'systems', label: 'Which tools, channels, or files are involved?', type: 'textarea', max: 300, placeholder: 'List known systems. Do not include passwords or access tokens.', required: true }, answer('tools', 'systems'))}
    ${field({ key: 'constraints', label: 'What constraints must the design respect?', type: 'textarea', max: 300, placeholder: 'Privacy, approvals, budget, internet access, existing contracts…', required: true }, answer('tools', 'constraints'))}
    <fieldset class="automation-field full"><legend>How much human review should remain? *</legend><div class="automation-choice-row">${['Review each item', 'Review exceptions', 'Approve before final action'].map(label => `<label class="automation-choice"><input type="radio" name="humanReview" value="${escapeHtml(label)}" ${answer('tools', 'humanReview') === label ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`).join('')}</div><span class="automation-inline-error" id="error-humanReview"></span></fieldset>
    <p class="automation-hint">Common questions to examine: ${escapeHtml(template.risks.join('; '))}.</p>
  </div>`;
}
function outcomesMarkup() {
  return `<div class="automation-field-grid">
    <div class="automation-field full">${field({ key: 'desired', label: 'What should be easier or better?', type: 'textarea', max: 260, placeholder: 'Describe the desired change, not a guaranteed result.', required: true }, answer('outcomes', 'desired'))}</div>
    ${field({ key: 'priority', label: 'What matters most for a first step?', type: 'select', options: ['Reduce repeated manual work', 'Improve visibility or tracking', 'Reduce missed handoffs', 'Improve consistency or checks', 'Not sure yet'], required: true }, answer('outcomes', 'priority'))}
    ${field({ key: 'successSignal', label: 'How could you tell a small pilot is useful?', max: 220, placeholder: 'A measurable signal can be agreed later', required: true }, answer('outcomes', 'successSignal'))}
  </div>`;
}
function workflowSteps() {
  const template = selectedTemplate();
  return [
    { title: 'TRIGGER', text: template.trigger },
    { title: 'CAPTURE', text: `Collect only the agreed details for: ${state.answers.problem.task || 'the described task'}.` },
    { title: 'CHECK', text: 'Validate required information and identify exceptions before the next action.' },
    { title: 'ROUTE', text: template.actions[2] },
    { title: 'HUMAN REVIEW', text: state.answers.tools.humanReview || 'A person reviews uncertain or consequential cases.' },
  ];
}
function briefSections() {
  const template = selectedTemplate();
  return {
    supplied: [
      `Process: ${state.answers.problem.category}`, `Repeating task: ${state.answers.problem.task}`,
      `Pain point: ${state.answers.problem.pain}`, `Frequency: ${state.answers.problem.frequency}`,
      `Current workflow: ${state.answers.workflow.currentSteps}`, `Bottleneck: ${state.answers.workflow.bottleneck}`,
      `Human decision / exception: ${state.answers.workflow.exception}`, `Tools and channels: ${state.answers.tools.systems}`,
      `Constraints: ${state.answers.tools.constraints}`, `Human review preference: ${state.answers.tools.humanReview}`,
      `Desired outcome: ${state.answers.outcomes.desired}`, `First priority: ${state.answers.outcomes.priority}`,
      `Possible success signal: ${state.answers.outcomes.successSignal}`,
    ],
    assumptions: [
      'The described process and examples are accurate and representative.',
      'The named tools can support an approved, secure integration; this has not been checked.',
      'A process owner can confirm permissions, data handling, exception rules, and support responsibilities.',
      'No time, cost, accuracy, or revenue benefit has been measured or guaranteed.',
    ],
    architecture: [
      `Start: ${template.trigger}.`, 'Capture only fields required to move the task forward.',
      'Validate required inputs and flag duplicates or exceptions for a person.',
      `Route to the agreed next step. Suggested actions to consider: ${template.actions.join('; ')}.`,
      `Maintain human review: ${state.answers.tools.humanReview}.`,
      'Record status in an already approved system, after access, retention, and ownership are confirmed.',
    ],
    questions: [
      ...template.risks, 'Which system is the authoritative source, and who may access it?',
      'What should happen when data is missing, duplicated, or a connected service is unavailable?',
      'What baseline and pilot measurement would confirm whether the change is worthwhile?',
      'Who approves, supports, and can pause the workflow?',
    ],
    steps: workflowSteps(),
    potentialBenefit: template.benefit,
  };
}
function workflowPreview() {
  const steps = briefSections().steps;
  return `<div class="automation-workflow-wrap"><div class="automation-workflow-head"><span>ILLUSTRATIVE WORKFLOW / NOT EXECUTED</span><span>SELECT A STEP</span></div><div class="automation-workflow" role="group" aria-label="Illustrative proposed workflow">${steps.map((step, index) => `<div class="automation-flow-item"><button type="button" class="automation-flow-node" data-step="${index}" aria-pressed="${index === 0}"><strong>0${index + 1} / ${escapeHtml(step.title)}</strong><span>${escapeHtml(step.text)}</span></button></div>`).join('')}</div><p class="automation-detail" id="workflow-detail" aria-live="polite"></p></div>`;
}
function briefMarkup() {
  const data = briefSections();
  const list = items => `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  return `<div class="automation-output-grid">
    <section class="automation-output"><h3>Supplied by you</h3>${list(data.supplied)}</section>
    <section class="automation-output"><h3>Assumptions to confirm</h3>${list(data.assumptions)}</section>
    <section class="automation-output"><h3>Suggested workflow / architecture</h3>${list(data.architecture)}</section>
    <section class="automation-output"><h3>Potential benefit — unmeasured</h3><p>${escapeHtml(data.potentialBenefit)}</p></section>
    <section class="automation-output"><h3>Questions before implementation</h3>${list(data.questions)}</section>
  </div>${workflowPreview()}`;
}
function inquiryText() {
  const data = briefSections();
  return [
    'Subject: Automation workflow enquiry', '', 'Hello Philip,', '',
    'I used the Automation Discovery Studio to prepare this first-pass brief. I would like to discuss whether this workflow is suitable for further discovery.', '',
    'INFORMATION I PROVIDED', ...data.supplied.map(item => `- ${item}`), '',
    'ILLUSTRATIVE DIRECTION', ...data.architecture.map(item => `- ${item}`), '',
    'ASSUMPTIONS AND QUESTIONS TO CONFIRM', ...data.assumptions.map(item => `- ${item}`), ...data.questions.map(item => `- ${item}`), '',
    'This is an illustrative planning brief, not a live integration or a guaranteed outcome. I reviewed this email and will send it myself if I choose.', '', 'Regards,',
  ].join('\n');
}
function mailtoHref(text) {
  return `mailto:taiwophilip@consultant.com?subject=${encodeURIComponent('Automation workflow enquiry')}&body=${encodeURIComponent(text)}`;
}
function reviewMarkup() {
  const text = inquiryText();
  return `<div class="automation-copy-row"><button type="button" id="copy-inquiry" class="automation-button primary">Copy inquiry draft</button><span id="copy-status" class="automation-copy-status" role="status" aria-live="polite"></span></div>
    <div id="manual-copy" class="automation-manual-copy" hidden><label for="manual-inquiry">Clipboard unavailable — select and copy this draft manually</label><textarea id="manual-inquiry" readonly>${escapeHtml(text)}</textarea></div>
    <section class="automation-inquiry" aria-labelledby="inquiry-heading"><h3 id="inquiry-heading" class="automation-stage-kicker">PREPARE AN INQUIRY</h3><p class="automation-inquiry-note">This opens a draft in your own email app. Review it, remove anything you do not want to share, and send it yourself. Nothing is sent by this page.</p><a class="automation-button" id="email-inquiry" href="${mailtoHref(text)}">Open email draft ↗</a></section>
    <p class="automation-hint">This brief is deterministic browser output, not a live AI response. Do not include passwords, payment details, or information you are not comfortable sharing.</p>`;
}
function render() {
  progress(); setFeedback();
  const pages = [
    () => frame(0, 'Start with the friction.', 'Choose one process. Describe the repeated task and the point where effort, time, or accuracy is lost.', problemMarkup()),
    () => frame(1, 'Map the current workflow.', 'Describe how the work moves today, where it gets stuck, and what still needs human judgment.', workflowMarkup()),
    () => frame(2, 'Name the tools and boundaries.', 'List systems and practical constraints. Do not enter credentials, customer records, or sensitive details.', toolsMarkup()),
    () => frame(3, 'Define a useful first outcome.', 'Choose what matters most. Treat the success signal as something to measure later—not a promise.', outcomesMarkup()),
    () => frame(4, 'Review the illustrative brief.', 'Check what came from you, what remains an assumption, and what still needs confirmation.', briefMarkup()),
    () => frame(5, 'Prepare an inquiry you control.', 'Review the visitor-controlled email draft. This page will not send or submit your answers.', reviewMarkup()),
  ];
  content.innerHTML = pages[state.stage]();
  bindInputs();
  if (state.stage === 4) bindWorkflowPreview();
  if (state.stage === 5) bindCopyFallback();
  content.querySelector('.automation-stage-title')?.focus({ preventScroll: true });
}
function bindInputs() {
  content.querySelectorAll('input, textarea, select').forEach(control => {
    const group = ['problem', 'workflow', 'tools', 'outcomes'][state.stage];
    const eventName = control.type === 'radio' ? 'change' : 'input';
    control.addEventListener(eventName, () => {
      if (control.type === 'radio' && !control.checked) return;
      state.answers[group][control.name] = control.value;
      control.removeAttribute('aria-invalid');
      const error = document.querySelector(`#error-${CSS.escape(control.name)}`);
      if (error) error.textContent = '';
      clearButton.disabled = isEmpty(); setFeedback();
    });
  });
}
function validateStage() {
  setFeedback();
  const keys = {
    0: [['category', 'Choose a process type.'], ['task', 'Describe the repeated task.'], ['pain', 'Describe where effort or time is lost.'], ['frequency', 'Choose how often it happens.']],
    1: [['currentSteps', 'Describe the current workflow.'], ['bottleneck', 'Describe the main bottleneck.'], ['exception', 'Describe what needs human judgment, or enter “Not sure yet”.']],
    2: [['systems', 'List the tools or enter “Not sure yet”.'], ['constraints', 'List constraints or enter “None known yet”.'], ['humanReview', 'Choose how much human review should remain.']],
    3: [['desired', 'Describe the desired outcome.'], ['priority', 'Choose a first priority.'], ['successSignal', 'Describe a possible success signal or enter “To be agreed”.']],
  }[state.stage] || [];
  const group = ['problem', 'workflow', 'tools', 'outcomes'][state.stage];
  for (const [key, message] of keys) {
    const inputValue = state.answers[group][key];
    if (!String(inputValue ?? '').trim()) {
      setFeedback(message, 'error');
      const control = content.querySelector(`[name="${CSS.escape(key)}"]`);
      control?.setAttribute('aria-invalid', 'true'); control?.focus();
      const error = document.querySelector(`#error-${CSS.escape(key)}`);
      if (error) error.textContent = message;
      return false;
    }
  }
  return true;
}
function bindWorkflowPreview() {
  const buttons = [...content.querySelectorAll('[data-step]')];
  const detail = document.querySelector('#workflow-detail');
  const select = index => {
    buttons.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(index === buttonIndex)));
    if (detail) detail.textContent = briefSections().steps[index].text;
  };
  buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
  select(0);
}
function bindCopyFallback() {
  const button = document.querySelector('#copy-inquiry');
  const status = document.querySelector('#copy-status');
  const fallback = document.querySelector('#manual-copy');
  button?.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(inquiryText());
      fallback.hidden = true; status.textContent = 'Copied to your clipboard. Nothing was sent.';
    } catch {
      fallback.hidden = false;
      status.textContent = 'Clipboard access failed. The draft is available below for manual selection and copying.';
      document.querySelector('#manual-inquiry')?.focus();
    }
  });
}
function resetAnswers(announce = true) {
  state.stage = 0;
  state.answers = {
    problem: { category: '', task: '', pain: '', frequency: '' },
    workflow: { currentSteps: '', bottleneck: '', exception: '' },
    tools: { systems: '', constraints: '', humanReview: '' },
    outcomes: { desired: '', priority: '', successSignal: '' },
  };
  render();
  if (announce) setFeedback('Answers cleared from this page’s memory.', 'success');
}
backButton.addEventListener('click', () => {
  if (state.stage === 0) return;
  state.stage -= 1; render();
  window.scrollTo({ top: document.querySelector('.automation-session').offsetTop, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
continueButton.addEventListener('click', () => {
  if (state.stage === 5) { resetAnswers(); return; }
  if (state.stage < 4 && !validateStage()) return;
  state.stage = Math.min(5, state.stage + 1); render();
  window.scrollTo({ top: document.querySelector('.automation-session').offsetTop, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
restartButton.addEventListener('click', () => resetAnswers());
clearButton.addEventListener('click', () => resetAnswers());
render();
