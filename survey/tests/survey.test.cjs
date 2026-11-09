'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { readSpec, renderSpec } = require('../build-spec.cjs');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
const generated = fs.readFileSync(path.join(root, 'SurveySpec.gs'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const expectedTitles = [
  'What best describes your role?',
  'Which banking-app activities do customers most frequently need help understanding?',
  'Based on your experience, what most commonly makes digital banking difficult for customers?',
  'How frequently do customers need additional assistance after their initial banking-app setup or demonstration?',
  "Based on what you've observed, which approach helps customers understand and remember digital banking procedures best?",
  'Which languages do customers commonly prefer when receiving banking assistance?',
  'What is one recurring customer difficulty you believe banks or technology providers could address better?',
  'Your insights: What should we focus on when developing a solution?'
];
// Independent approval snapshot: changing text requires human review, not regenerating this hash.
const approvedHash = 'c13eb8a5cfcd1c154422b96fa4e46b84d1e618b747194fcfd7321c0213543d53';

function harness(fault = {}) {
  const state = {};
  const forms = [];
  const logs = [];
  const calls = { create: 0, open: 0, mutations: 0, propertyWrites: 0, releases: 0 };
  let locked = Boolean(fault.lockBusy);
  const properties = {
    getProperty: key => state[key] ?? null,
    setProperty(key, value) {
      calls.propertyWrites++;
      if (key === fault.failPersistKey && (!fault.failPersistValue || fault.failPersistValue === value)) throw new Error('Simulated property write failure');
      if (key !== fault.silentPersistKey) state[key] = value;
    }
  };
  function addItem(form, type) {
    if (form.items.length === fault.failItemAt) throw new Error('Simulated item failure');
    calls.mutations++;
    const item = { type, title: '', helpText: '', required: false, options: [], other: false };
    for (const [method, field] of Object.entries({ setTitle: 'title', setHelpText: 'helpText', setRequired: 'required', setChoiceValues: 'options', showOtherOption: 'other', setValidation: 'validation' })) {
      item[method] = value => { calls.mutations++; item[field] = value; return item; };
    }
    Object.assign(item, {
      getTitle: () => item.title, getHelpText: () => item.helpText, isRequired: () => item.required,
      getChoices: () => item.options.map(value => ({ getValue: () => value })), hasOtherOption: () => item.other
    });
    form.items.push(item);
    return item;
  }
  function makeForm(title, published) {
    const form = { title, published: fault.published ?? published, description: '', confirmation: '', items: [], destination: null, settings: {} };
    const pairs = {
      collectEmail: ['setCollectEmail', 'collectsEmail'], publishingSummary: ['setPublishingSummary', 'isPublishingSummary'],
      allowResponseEdits: ['setAllowResponseEdits', 'canEditResponse'], limitOneResponsePerUser: ['setLimitOneResponsePerUser', 'hasLimitOneResponsePerUser'],
      shuffleQuestions: ['setShuffleQuestions', 'getShuffleQuestions'], isQuiz: ['setIsQuiz', 'isQuiz'],
      showLinkToRespondAgain: ['setShowLinkToRespondAgain', 'hasRespondAgainLink'], acceptingResponses: ['setAcceptingResponses', 'isAcceptingResponses']
    };
    for (const [key, [setter, getter]] of Object.entries(pairs)) {
      form.settings[key] = true; // Deliberately unsafe defaults: code must explicitly disable each.
      form[setter] = value => { calls.mutations++; form.settings[key] = value; return form; };
      form[getter] = () => form.settings[key];
    }
    Object.assign(form, {
      getId: () => 'synthetic-form-id', supportsAdvancedResponderPermissions: () => fault.supports !== false,
      isPublished: () => form.published, getTitle: () => form.title,
      setTitle: value => { calls.mutations++; if (!fault.ignoreTitleWrite) form.title = value; return form; },
      setDescription: value => { calls.mutations++; form.description = value; return form; }, getDescription: () => form.description,
      setConfirmationMessage: value => { calls.mutations++; form.confirmation = value; return form; }, getConfirmationMessage: () => form.confirmation,
      getDestinationId: () => {
        if (fault.destinationError) throw new Error(fault.destinationError);
        if (!form.destination) throw new Error('The form currently has no response destination.');
        return form.destination;
      },
      addMultipleChoiceItem: () => addItem(form, 'MULTIPLE_CHOICE'), addCheckboxItem: () => addItem(form, 'CHECKBOX'),
      addParagraphTextItem: () => addItem(form, 'PARAGRAPH_TEXT'),
      // Real getItems() returns generic Items: require the appropriate type conversion.
      getItems: () => form.items.map(item => {
        const raw = { getType: () => item.type };
        const method = { MULTIPLE_CHOICE: 'asMultipleChoiceItem', CHECKBOX: 'asCheckboxItem', PARAGRAPH_TEXT: 'asParagraphTextItem' }[item.type];
        raw[method] = () => item;
        return raw;
      }),
      getEditUrl: () => 'https://example.invalid/synthetic/edit', getPublishedUrl: () => 'https://example.invalid/synthetic/viewform'
    });
    return form;
  }
  const context = vm.createContext({
    console: { log: value => logs.push(value) },
    PropertiesService: { getScriptProperties: () => properties },
    LockService: { getScriptLock: () => ({
      tryLock: timeout => { assert.equal(timeout, 10000); if (locked) return false; locked = true; return true; },
      releaseLock: () => { locked = false; calls.releases++; }
    }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
      computeDigest: (algorithm, text, encoding) => {
        assert.equal(algorithm, 'SHA_256'); assert.equal(encoding, 'UTF_8');
        return [...crypto.createHash('sha256').update(text, 'utf8').digest()].map(byte => byte > 127 ? byte - 256 : byte);
      }
    },
    FormApp: {
      ItemType: { MULTIPLE_CHOICE: 'MULTIPLE_CHOICE', CHECKBOX: 'CHECKBOX', PARAGRAPH_TEXT: 'PARAGRAPH_TEXT' },
      create(title, published) {
        assert.equal(state.DC_PHASE, 'CREATING'); assert.equal(published, false);
        calls.create++;
        if (fault.failCreate === 'before') throw new Error('Simulated creation failure');
        const form = makeForm(title, published); forms.push(form);
        if (fault.failCreate === 'after') throw new Error('Simulated ambiguous creation result');
        return form;
      },
      openById(id) {
        calls.open++;
        if (fault.failOpen || id !== 'synthetic-form-id' || !forms[0]) throw new Error('Simulated inaccessible form');
        return forms[0];
      },
      createCheckboxValidation() {
        const rule = {};
        const builder = {
          requireSelectAtMost: value => { rule.max = value; return builder; },
          setHelpText: value => { rule.helpText = value; return builder; }, build: () => ({ ...rule })
        };
        return builder;
      }
    }
  });
  new vm.Script(generated, { filename: 'SurveySpec.gs' }).runInContext(context);
  new vm.Script(code, { filename: 'Code.gs' }).runInContext(context);
  return { state, forms, logs, calls, context, fault };
}

test('empty title repair changes only the title, completes recovery and can be repeated', () => {
  const h = harness(); h.context.createOrOpenDraft();
  h.state.DC_PHASE = 'CREATING'; delete h.state.DC_SPEC_FINGERPRINT;
  h.forms[0].title = '';
  const before = { ...h.calls };
  const report = h.context.repairEmptyDraftTitle();
  assert.equal(h.forms[0].title, readSpec().title);
  assert.equal(h.calls.mutations, before.mutations + 1);
  assert.equal(h.calls.create, before.create);
  assert.equal(h.state.DC_PHASE, 'COMPLETE');
  assert.equal(h.state.DC_SPEC_FINGERPRINT, approvedHash);
  assert.equal(report.status, 'UNPUBLISHED_DRAFT');
  h.context.repairEmptyDraftTitle(); h.context.verifyDraft();
  assert.equal(h.calls.mutations, before.mutations + 1);
  assert.equal(h.calls.create, before.create);
});

test('empty title repair refuses unsafe state or other mismatches before changing anything', () => {
  for (const change of [
    h => { delete h.state.DC_FORM_ID; },
    h => { h.state.DC_SPEC_FINGERPRINT = 'different'; },
    h => { h.forms[0].published = true; },
    h => { h.forms[0].items.pop(); },
    h => { h.forms[0].title = 'Different title'; },
    h => { h.fault.failOpen = true; }
  ]) {
    const h = harness(); h.context.createOrOpenDraft();
    h.state.DC_PHASE = 'CREATING'; h.forms[0].title = ''; change(h);
    const before = { ...h.calls };
    assert.throws(() => h.context.repairEmptyDraftTitle());
    assert.equal(h.calls.mutations, before.mutations);
    assert.equal(h.calls.propertyWrites, before.propertyWrites);
    assert.equal(h.calls.create, before.create);
  }
});

test('empty title repair does not mark completion if Google does not retain the title', () => {
  const h = harness({ ignoreTitleWrite: true }); h.context.createOrOpenDraft();
  h.state.DC_PHASE = 'CREATING'; delete h.state.DC_SPEC_FINGERPRINT;
  h.forms[0].title = '';
  const before = h.calls.propertyWrites;
  assert.throws(() => h.context.repairEmptyDraftTitle(), /mismatch: title/);
  assert.equal(h.state.DC_PHASE, 'CREATING');
  assert.equal(h.calls.propertyWrites, before);
  assert.equal(h.calls.create, 1);
});

test('title diagnostic reads a blocked draft without changing form or stored state', () => {
  const h = harness(); h.context.createOrOpenDraft();
  h.state.DC_PHASE = 'CREATING';
  h.forms[0].title = readSpec().title + '\u200B';
  const before = { ...h.calls };
  const stateBefore = { ...h.state };
  const result = plain(h.context.inspectDraftTitle());
  assert.equal(result.editingUrl, 'https://example.invalid/synthetic/edit');
  assert.equal(result.expectedTitle, readSpec().title);
  assert.equal(result.actualTitle, h.forms[0].title);
  assert.equal(result.titlesMatch, false);
  assert.deepEqual(result.firstDifference, {
    characterPosition: Array.from(readSpec().title).length + 1,
    expected: '(end of title)', actual: '\u200B (U+200B)'
  });
  assert.equal(h.calls.create, before.create);
  assert.equal(h.calls.mutations, before.mutations);
  assert.equal(h.calls.propertyWrites, before.propertyWrites);
  assert.deepEqual(h.state, stateBefore);
  h.forms[0].title = readSpec().title;
  const matching = h.context.inspectDraftTitle();
  assert.equal(matching.titlesMatch, true);
  assert.equal(matching.firstDifference, null);
});

test('title diagnostic refuses missing saved ID without creating or changing anything', () => {
  const h = harness();
  assert.throws(() => h.context.inspectDraftTitle(), /No saved form ID/);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.open, 0);
  assert.equal(h.calls.mutations, 0);
  assert.equal(h.calls.propertyWrites, 0);
});

test('approved content fingerprint, generated parity, titles, types and refinement', () => {
  const spec = readSpec();
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(spec)).digest('hex'), approvedHash);
  assert.equal(generated.replace(/\r\n/g, '\n'), renderSpec(spec));
  assert.deepEqual(spec.questions.map(q => q.title), expectedTitles);
  assert.deepEqual(spec.questions.map(q => q.type), ['MULTIPLE_CHOICE', 'CHECKBOX', 'CHECKBOX', 'MULTIPLE_CHOICE', 'MULTIPLE_CHOICE', 'CHECKBOX', 'PARAGRAPH_TEXT', 'PARAGRAPH_TEXT']);
  assert.deepEqual(spec.questions.filter(q => q.other).map(q => q.id), ['Q1', 'Q2', 'Q3', 'Q6']);
  assert.equal(spec.questions[2].options.at(-1), 'Not sure');
  assert.ok(!JSON.stringify(spec).includes('Other / Not sure'));
});

test('creates one explicitly unpublished, closed form with exact content and settings', () => {
  const h = harness(); const report = h.context.createOrOpenDraft(); const form = h.forms[0]; const spec = readSpec();
  assert.equal(h.calls.create, 1); assert.equal(h.state.DC_PHASE, 'COMPLETE');
  assert.equal(h.state.DC_SPEC_FINGERPRINT, approvedHash);
  assert.equal(form.published, false); assert.equal(form.destination, null);
  assert.deepEqual(plain(form.settings), spec.settings);
  assert.equal(form.description, spec.affiliation + '\n\n' + spec.description);
  assert.equal(form.confirmation, spec.confirmationMessage);
  assert.equal(form.items.length, 8);
  form.items.forEach((item, index) => {
    const q = spec.questions[index];
    assert.equal(item.title, q.title); assert.equal(item.helpText, q.helpText);
    assert.equal(item.type, q.type); assert.equal(item.required, true);
    if (q.options) { assert.deepEqual(plain(item.options), q.options); assert.equal(item.other, Boolean(q.other)); }
  });
  assert.equal(report.status, 'UNPUBLISHED_DRAFT');
  assert.ok(report.respondentUrlStatus.includes('INACTIVE'));
  assert.equal(report.manualVerificationRequired.length, 4);
  assert.equal(h.calls.releases, 1);
});

test('checkbox limits are built with native Other enabled; Q6 has no maximum', () => {
  const h = harness(); h.context.createOrOpenDraft(); const items = h.forms[0].items;
  for (const [index, max, helpText] of [[1, 3, 'Select up to three.'], [2, 2, 'Select up to two.']]) {
    assert.deepEqual(items[index].validation, { max, helpText });
    assert.equal(items[index].other, true);
    // Model-only boundary scenarios, including Other as one selection; not live browser proof.
    const within = [...items[index].options.slice(0, max - 1), 'Other: synthetic mixed-language answer'];
    assert.equal(within.length <= items[index].validation.max, true);
    assert.equal([...within, items[index].options[max]].length <= items[index].validation.max, false);
  }
  assert.equal(items[5].validation, undefined);
  assert.equal(items[6].validation, undefined); assert.equal(items[7].validation, undefined);
});

test('repeat creation and verifyDraft reuse the same form without any writes', () => {
  const h = harness(); const first = plain(h.context.createOrOpenDraft());
  const writes = [h.calls.mutations, h.calls.propertyWrites];
  assert.deepEqual(plain(h.context.createOrOpenDraft()), first);
  assert.deepEqual(plain(h.context.verifyDraft()), first);
  assert.equal(h.calls.create, 1);
  assert.deepEqual([h.calls.mutations, h.calls.propertyWrites], writes);
});

test('verifyDraft on a new project never creates a form or writes state', () => {
  const h = harness(); assert.throws(() => h.context.verifyDraft(), /Manual recovery/);
  assert.equal(h.calls.create, 0); assert.equal(h.calls.propertyWrites, 0);
});

test('reported no-destination exception is expected; other API errors propagate', () => {
  const h = harness();
  assert.equal(h.context.createOrOpenDraft().status, 'UNPUBLISHED_DRAFT');
  h.fault.destinationError = 'Access denied';
  assert.throws(() => h.context.verifyDraft(), /Access denied/);
  assert.equal(h.calls.create, 1);
});

test('recover the exact legacy failure using saved ID, without changing form or duplicating it', () => {
  const h = harness();
  const fixedCheck = h.context.hasResponseDestination_;
  // Reproduce the old bug: direct getter throws after all eight questions are built.
  h.context.hasResponseDestination_ = form => Boolean(form.getDestinationId());
  assert.throws(() => h.context.createOrOpenDraft(), /no response destination/);
  assert.equal(h.state.DC_PHASE, 'CREATING');
  assert.equal(h.state.DC_FORM_ID, 'synthetic-form-id');
  assert.equal(h.forms[0].items.length, 8);
  assert.equal(h.state.DC_SPEC_FINGERPRINT, undefined);
  h.context.hasResponseDestination_ = fixedCheck;
  const mutations = h.calls.mutations;
  const recovered = plain(h.context.recoverExistingDraft());
  assert.equal(h.state.DC_PHASE, 'COMPLETE');
  assert.equal(h.state.DC_SPEC_FINGERPRINT, approvedHash);
  assert.equal(h.calls.create, 1); assert.equal(h.calls.mutations, mutations);
  assert.deepEqual(plain(h.context.verifyDraft()), recovered);
  const writes = h.calls.propertyWrites;
  assert.deepEqual(plain(h.context.recoverExistingDraft()), recovered);
  assert.deepEqual(plain(h.context.createOrOpenDraft()), recovered);
  assert.equal(h.calls.propertyWrites, writes); assert.equal(h.calls.create, 1);
});

for (const [label, mutate] of [
  ['missing saved ID', h => { delete h.state.DC_FORM_ID; }],
  ['incomplete questions', h => { h.forms[0].items.pop(); }],
  ['published form', h => { h.forms[0].published = true; }],
  ['changed specification marker', h => { h.state.DC_SPEC_FINGERPRINT = 'mismatch'; }],
  ['inaccessible form', h => { h.fault.failOpen = true; }],
  ['linked destination', h => { h.forms[0].destination = 'synthetic-sheet'; }],
  ['unexpected API error', h => { h.fault.destinationError = 'Service unavailable'; }]
]) {
  test('recovery refuses ' + label + ' without writes or replacement', () => {
    const h = harness({ destinationError: 'Interrupted verification' });
    assert.throws(() => h.context.createOrOpenDraft(), /Interrupted verification/);
    delete h.fault.destinationError;
    mutate(h);
    const before = { ...h.calls };
    assert.throws(() => h.context.recoverExistingDraft());
    assert.equal(h.state.DC_PHASE, 'CREATING');
    assert.equal(h.calls.create, before.create);
    assert.equal(h.calls.mutations, before.mutations);
    assert.equal(h.calls.propertyWrites, before.propertyWrites);
  });
}

test('concurrent invocation stops before reading or mutating form state', () => {
  const h = harness({ lockBusy: true });
  assert.throws(() => h.context.createOrOpenDraft(), /Another survey operation/);
  assert.equal(h.calls.create, 0); assert.equal(h.calls.propertyWrites, 0); assert.equal(h.calls.releases, 0);
});

for (const [label, fault] of [
  ['creation throws before result', { failCreate: 'before' }],
  ['creation succeeds but result is lost', { failCreate: 'after' }],
  ['ID persistence fails', { failPersistKey: 'DC_FORM_ID' }],
  ['ID persistence silently fails', { silentPersistKey: 'DC_FORM_ID' }],
  ['construction stops partway', { failItemAt: 3 }],
  ['fingerprint persistence fails', { failPersistKey: 'DC_SPEC_FINGERPRINT' }],
  ['completion persistence fails', { failPersistKey: 'DC_PHASE', failPersistValue: 'COMPLETE' }],
  ['publishing controls unsupported', { supports: false }],
  ['creation unexpectedly returns published form', { published: true }]
]) {
  test(label + ': retain marker, release lock and never create replacement', () => {
    const h = harness(fault);
    assert.throws(() => h.context.createOrOpenDraft());
    assert.equal(h.state.DC_PHASE, 'CREATING'); assert.equal(h.calls.create, 1); assert.equal(h.calls.releases, 1);
    const mutations = h.calls.mutations;
    assert.throws(() => h.context.createOrOpenDraft(), /Manual recovery/);
    assert.equal(h.calls.create, 1); assert.equal(h.calls.mutations, mutations);
  });
}

for (const fault of [{ failPersistKey: 'DC_PHASE' }, { silentPersistKey: 'DC_PHASE' }]) {
  test('creation marker must persist before external creation: ' + JSON.stringify(fault), () => {
    const h = harness(fault); assert.throws(() => h.context.createOrOpenDraft());
    assert.equal(h.calls.create, 0); assert.equal(h.calls.releases, 1);
  });
}

for (const state of [{ DC_FORM_ID: 'unknown' }, { DC_PHASE: 'CREATING' }, { DC_PHASE: 'COMPLETE' }, { DC_SPEC_FINGERPRINT: 'unknown' }]) {
  test('incomplete stored state never creates a new form: ' + JSON.stringify(state), () => {
    const h = harness(); Object.assign(h.state, state);
    assert.throws(() => h.context.createOrOpenDraft(), /Manual recovery/);
    assert.equal(h.calls.create, 0); assert.equal(h.calls.propertyWrites, 0);
  });
}

test('lost access and changed specification never trigger replacement', () => {
  const h = harness(); h.context.createOrOpenDraft(); h.fault.failOpen = true;
  assert.throws(() => h.context.createOrOpenDraft(), /inaccessible/);
  h.fault.failOpen = false;
  const changed = readSpec(); changed.description += '\nUnapproved change'; h.context.getSurveySpec = () => changed;
  assert.throws(() => h.context.createOrOpenDraft(), /Manual recovery/);
  assert.equal(h.calls.create, 1);
});

for (const [label, mutate] of [
  ['published form', f => { f.published = true; }],
  ['wrong title', f => { f.title += ' changed'; }],
  ['wrong description', f => { f.description += ' changed'; }],
  ['wrong confirmation', f => { f.confirmation += ' changed'; }],
  ['extra item', f => { f.items.push(f.items[0]); }],
  ['missing item', f => { f.items.pop(); }],
  ['reordered items', f => { [f.items[0], f.items[1]] = [f.items[1], f.items[0]]; }],
  ['wrong options', f => { f.items[2].options = ['Other / Not sure']; }],
  ['missing Other', f => { f.items[2].other = false; }],
  ['optional paragraph', f => { f.items[6].required = false; }],
  ['altered help text', f => { f.items[7].helpText = 'changed'; }],
  ['linked response destination', f => { f.destination = 'synthetic-sheet'; }],
  ...Object.keys(readSpec().settings).map(key => [key + ' enabled', f => { f.settings[key] = true; }])
]) {
  test('detects ' + label + ' without repair or replacement', () => {
    const h = harness(); h.context.createOrOpenDraft(); mutate(h.forms[0]);
    const writes = [h.calls.mutations, h.calls.propertyWrites];
    assert.throws(() => h.context.verifyDraft()); assert.throws(() => h.context.createOrOpenDraft());
    assert.equal(h.calls.create, 1); assert.deepEqual([h.calls.mutations, h.calls.propertyWrites], writes);
  });
}

for (const [label, mutate] of [
  ['wrong count', s => s.questions.pop()], ['wrong type', s => { s.questions[7].type = 'TEXT'; }],
  ['optional Q8', s => { s.questions[7].required = false; }], ['unsafe email setting', s => { s.settings.collectEmail = true; }],
  ['Q2 wrong limit', s => { s.questions[1].maxSelections = 4; }], ['Q3 wrong limit', s => { s.questions[2].maxSelections = 3; }],
  ['literal Other duplicate', s => s.questions[0].options.push('Other')],
  ['paragraph restriction', s => { s.questions[6].maxSelections = 1; }],
  ['missing Not sure', s => { s.questions[2].options = s.questions[2].options.slice(0, -1); }]
]) {
  test('rejects invalid specification before external effects: ' + label, () => {
    const h = harness(); const spec = readSpec(); mutate(spec); h.context.getSurveySpec = () => spec;
    assert.throws(() => h.context.createOrOpenDraft(), /Invalid or unsafe/);
    assert.equal(h.calls.create, 0); assert.equal(h.calls.propertyWrites, 0);
  });
}

test('Unicode content survives generation and paragraph items receive no language validation', () => {
  const sample = "Ngidinga usizo — ke hloka thuso; English + isiZulu; Tshivenḓa: ḓḽṋṅṱ; Xitsonga; Afrikaans: hulp.";
  const spec = readSpec(); spec.questions[7].helpText = sample;
  const context = vm.createContext({}); new vm.Script(renderSpec(spec)).runInContext(context);
  assert.equal(context.getSurveySpec().questions[7].helpText, sample);
  const h = harness(); h.context.createOrOpenDraft();
  assert.equal(h.forms[0].items[6].validation, undefined); assert.equal(h.forms[0].items[7].validation, undefined);
});

test('manifest is V8 with only forms runtime scope and no deployment or libraries', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'appsscript.json'), 'utf8'));
  assert.deepEqual(manifest, { timeZone: 'Africa/Johannesburg', runtimeVersion: 'V8', oauthScopes: ['https://www.googleapis.com/auth/forms'] });
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.devDependencies, { '@google/clasp': '3.4.1' });
  assert.equal(pkg.dependencies, undefined);
});

test('upload allowlist contains exactly the three runtime files', () => {
  const rules = fs.readFileSync(path.join(root, '.claspignore'), 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#'));
  assert.deepEqual(rules, ['**/**', '!appsscript.json', '!Code.gs', '!SurveySpec.gs']);
});

test('runtime has no publishing, sharing, response access, deletion or external-fetch calls', () => {
  assert.doesNotMatch(code, /\.(setPublished|addEditor|addEditors|addPublishedReader|addPublishedReaders|createResponse|getResponses|getResponse|deleteItem|deleteResponse|deleteAllResponses|setDestination|setRequireLogin|submit)\s*\(/);
  assert.doesNotMatch(code, /\b(DriveApp|SpreadsheetApp|UrlFetchApp|ScriptApp|Session)\s*\./);
});
