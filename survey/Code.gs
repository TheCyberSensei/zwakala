/** Run only after explicit approval for Google access and one unpublished form. */
function createOrOpenDraft() {
  return withSurveyLock_(function () {
    const spec = getSurveySpec();
    validateSpec_(spec);
    const properties = PropertiesService.getScriptProperties();
    const state = readState_(properties);
    const fingerprint = fingerprint_(spec);
    if (state.id || state.phase || state.fingerprint) {
      requireComplete_(state, fingerprint);
      return reportDraft_(verifyForm_(FormApp.openById(state.id), spec));
    }

    // Persist BEFORE calling Google: an ambiguous create failure must not be retried.
    persist_(properties, 'DC_PHASE', 'CREATING');
    const form = FormApp.create(spec.title, false);
    persist_(properties, 'DC_FORM_ID', form.getId());
    requireUnpublished_(form);
    form.setDescription(spec.affiliation + '\n\n' + spec.description);
    form.setConfirmationMessage(spec.confirmationMessage);
    const settings = settingMethods_();
    Object.keys(settings).forEach(function (key) {
      form[settings[key][0]](spec.settings[key]);
    });
    spec.questions.forEach(function (question) {
      const item = question.type === 'MULTIPLE_CHOICE' ? form.addMultipleChoiceItem() :
        question.type === 'CHECKBOX' ? form.addCheckboxItem() : form.addParagraphTextItem();
      item.setTitle(question.title).setHelpText(question.helpText).setRequired(true);
      if (question.type !== 'PARAGRAPH_TEXT') {
        item.setChoiceValues(question.options).showOtherOption(question.other);
      }
      if (question.maxSelections !== undefined) {
        item.setValidation(FormApp.createCheckboxValidation()
          .requireSelectAtMost(question.maxSelections)
          .setHelpText(question.helpText).build());
      }
    });
    const report = verifyForm_(form, spec);
    persist_(properties, 'DC_SPEC_FINGERPRINT', fingerprint);
    persist_(properties, 'DC_PHASE', 'COMPLETE');
    return reportDraft_(report);
  });
}

/** Read configuration only. Never fetch, create or submit survey responses. */
function verifyDraft() {
  return withSurveyLock_(function () {
    const spec = getSurveySpec();
    validateSpec_(spec);
    const state = readState_(PropertiesService.getScriptProperties());
    requireComplete_(state, fingerprint_(spec));
    return reportDraft_(verifyForm_(FormApp.openById(state.id), spec));
  });
}

/** Explicit recovery for a saved form whose final verification was interrupted. */
function recoverExistingDraft() {
  return withSurveyLock_(function () {
    const spec = getSurveySpec();
    validateSpec_(spec);
    const properties = PropertiesService.getScriptProperties();
    const state = readState_(properties);
    const fingerprint = fingerprint_(spec);
    if (state.phase === 'COMPLETE') {
      requireComplete_(state, fingerprint);
      return reportDraft_(verifyForm_(FormApp.openById(state.id), spec));
    }
    if (!state.id || state.phase !== 'CREATING' ||
        (state.fingerprint && state.fingerprint !== fingerprint)) {
      throw new Error('Recovery requires the existing saved form and matching creation state. Do not clear properties or create a replacement.');
    }
    // Verify first. Never add, remove, repair or publish form items during recovery.
    const report = verifyForm_(FormApp.openById(state.id), spec);
    persist_(properties, 'DC_SPEC_FINGERPRINT', fingerprint);
    persist_(properties, 'DC_PHASE', 'COMPLETE');
    return reportDraft_(report);
  });
}

/** Explicit repair for the observed empty title; never creates or publishes a form. */
function repairEmptyDraftTitle() {
  return withSurveyLock_(function () {
    const spec = getSurveySpec();
    validateSpec_(spec);
    const properties = PropertiesService.getScriptProperties();
    const state = readState_(properties);
    const fingerprint = fingerprint_(spec);
    if (state.phase === 'COMPLETE') {
      requireComplete_(state, fingerprint);
    } else if (!state.id || state.phase !== 'CREATING' ||
        (state.fingerprint && state.fingerprint !== fingerprint)) {
      throw new Error('Title repair requires the saved draft and matching creation state. Do not clear properties.');
    }
    const form = FormApp.openById(state.id);
    const actualTitle = form.getTitle();
    if (actualTitle !== '' && actualTitle !== spec.title) {
      throw new Error('Title repair only handles an empty or already-correct title. No changes made.');
    }
    // Check every other readable setting before making this one explicit repair.
    verifyForm_(form, Object.assign({}, spec, { title: actualTitle }));
    if (actualTitle === '') form.setTitle(spec.title);
    const report = verifyForm_(form, spec);
    persist_(properties, 'DC_SPEC_FINGERPRINT', fingerprint);
    persist_(properties, 'DC_PHASE', 'COMPLETE');
    return reportDraft_(report);
  });
}

/** Read-only troubleshooting, including drafts whose recovery is blocked. */
function inspectDraftTitle() {
  return withSurveyLock_(function () {
    const state = readState_(PropertiesService.getScriptProperties());
    if (!state.id) throw new Error('No saved form ID. Do not create a replacement or clear properties.');
    const form = FormApp.openById(state.id);
    const expected = getSurveySpec().title;
    const actual = form.getTitle();
    const expectedCharacters = Array.from(expected);
    const actualCharacters = Array.from(actual);
    let index = 0;
    while (index < Math.max(expectedCharacters.length, actualCharacters.length) &&
        expectedCharacters[index] === actualCharacters[index]) index++;
    const describe = function (character) {
      return character === undefined ? '(end of title)' :
        character + ' (U+' + character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ')';
    };
    return reportDraft_({
      editingUrl: form.getEditUrl(),
      expectedTitle: expected,
      actualTitle: actual,
      titlesMatch: actual === expected,
      firstDifference: actual === expected ? null : {
        characterPosition: index + 1,
        expected: describe(expectedCharacters[index]),
        actual: describe(actualCharacters[index])
      }
    });
  });
}

function withSurveyLock_(action) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Another survey operation is running. No creation attempted.');
  try { return action(); } finally { lock.releaseLock(); }
}

function readState_(properties) {
  return {
    id: properties.getProperty('DC_FORM_ID'),
    phase: properties.getProperty('DC_PHASE'),
    fingerprint: properties.getProperty('DC_SPEC_FINGERPRINT')
  };
}

function persist_(properties, key, value) {
  properties.setProperty(key, value);
  if (properties.getProperty(key) !== value) {
    throw new Error('Survey state could not be verified. Stop and inspect Script Properties; do not reset them.');
  }
}

function requireComplete_(state, fingerprint) {
  if (!state.id || state.phase !== 'COMPLETE' || state.fingerprint !== fingerprint) {
    throw new Error('Missing, incomplete or changed survey state. Manual recovery approval is required; do not clear properties or create a replacement.');
  }
}

function fingerprint_(spec) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify(spec), Utilities.Charset.UTF_8).map(function (byte) {
    return ('0' + ((byte + 256) % 256).toString(16)).slice(-2);
  }).join('');
}

function settingMethods_() {
  return {
    collectEmail: ['setCollectEmail', 'collectsEmail'],
    publishingSummary: ['setPublishingSummary', 'isPublishingSummary'],
    allowResponseEdits: ['setAllowResponseEdits', 'canEditResponse'],
    limitOneResponsePerUser: ['setLimitOneResponsePerUser', 'hasLimitOneResponsePerUser'],
    shuffleQuestions: ['setShuffleQuestions', 'getShuffleQuestions'],
    isQuiz: ['setIsQuiz', 'isQuiz'],
    showLinkToRespondAgain: ['setShowLinkToRespondAgain', 'hasRespondAgainLink'],
    acceptingResponses: ['setAcceptingResponses', 'isAcceptingResponses']
  };
}

function validateSpec_(spec) {
  const fail = function () { throw new Error('Invalid or unsafe survey specification. No form operation permitted.'); };
  if (!spec || spec.schemaVersion !== 1) fail();
  ['title', 'affiliation', 'description', 'confirmationMessage'].forEach(function (key) {
    if (typeof spec[key] !== 'string' || !spec[key].trim()) fail();
  });
  const settings = settingMethods_();
  if (!spec.settings || Object.keys(spec.settings).length !== Object.keys(settings).length) fail();
  Object.keys(settings).forEach(function (key) { if (spec.settings[key] !== false) fail(); });
  const types = ['MULTIPLE_CHOICE', 'CHECKBOX', 'CHECKBOX', 'MULTIPLE_CHOICE',
    'MULTIPLE_CHOICE', 'CHECKBOX', 'PARAGRAPH_TEXT', 'PARAGRAPH_TEXT'];
  if (!Array.isArray(spec.questions) || spec.questions.length !== 8) fail();
  spec.questions.forEach(function (q, index) {
    if (!q || q.id !== 'Q' + (index + 1) || q.type !== types[index] || q.required !== true ||
        typeof q.title !== 'string' || !q.title.trim() || typeof q.helpText !== 'string') fail();
    if (q.type === 'PARAGRAPH_TEXT') {
      if ('options' in q || 'other' in q || 'maxSelections' in q || !q.helpText.trim()) fail();
    } else {
      if (!Array.isArray(q.options) || !q.options.length ||
          q.options.some(function (s) { return typeof s !== 'string' || !s.trim() || s === 'Other'; }) ||
          new Set(q.options).size !== q.options.length ||
          q.other !== [0, 1, 2, 5].includes(index)) fail();
      if (index === 1 || index === 2) {
        if (q.maxSelections !== (index === 1 ? 3 : 2)) fail();
      } else if ('maxSelections' in q) fail();
    }
  });
  if (!spec.questions[2].options.includes('Not sure') ||
      spec.questions[2].options.includes('Other / Not sure')) fail();
}

function requireUnpublished_(form) {
  if (!form.supportsAdvancedResponderPermissions()) {
    throw new Error('Publishing controls are unsupported. Stop; do not treat response closure as unpublished status.');
  }
  if (form.isPublished()) throw new Error('Form is published. No modification or replacement is permitted.');
}

function verifyForm_(form, spec) {
  requireUnpublished_(form);
  const failures = [];
  const equal = function (actual, expected, field) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(field);
  };
  equal(form.getTitle(), spec.title, 'title');
  equal(form.getDescription(), spec.affiliation + '\n\n' + spec.description, 'description');
  equal(form.getConfirmationMessage(), spec.confirmationMessage, 'confirmation message');
  const settings = settingMethods_();
  Object.keys(settings).forEach(function (key) { equal(form[settings[key][1]](), spec.settings[key], key); });
  if (hasResponseDestination_(form)) failures.push('unexpected response destination');
  const items = form.getItems();
  equal(items.length, 8, 'question count');
  spec.questions.forEach(function (q, index) {
    const raw = items[index];
    if (!raw || raw.getType() !== FormApp.ItemType[q.type]) {
      failures.push(q.id + ' type/order');
      return;
    }
    const item = q.type === 'MULTIPLE_CHOICE' ? raw.asMultipleChoiceItem() :
      q.type === 'CHECKBOX' ? raw.asCheckboxItem() : raw.asParagraphTextItem();
    equal(item.getTitle(), q.title, q.id + ' title');
    equal(item.getHelpText(), q.helpText, q.id + ' help text');
    equal(item.isRequired(), true, q.id + ' required');
    if (q.type !== 'PARAGRAPH_TEXT') {
      equal(item.getChoices().map(function (choice) { return choice.getValue(); }), q.options, q.id + ' fixed options');
      equal(item.hasOtherOption(), q.other, q.id + ' native Other');
    }
  });
  if (failures.length) throw new Error('Draft configuration mismatch: ' + failures.join(', ') + '. No automatic repair performed.');
  return {
    status: 'UNPUBLISHED_DRAFT',
    automatedConfigurationChecksPassed: true,
    editingUrl: form.getEditUrl(),
    respondentUrl: form.getPublishedUrl(),
    respondentUrlStatus: 'INACTIVE — UNPUBLISHED',
    manualVerificationRequired: [
      'Q2 maximum 3 and Q3 maximum 2, including native Other (FormApp has no validation getter).',
      'Workspace responder access, anonymous participation and option shuffle settings.',
      'Mobile/desktop rendering, native Other placement, paragraph help text and mixed-language input.',
      'Signed-out public accessibility only after separate publication approval.'
    ]
  };
}

function hasResponseDestination_(form) {
  try {
    return Boolean(form.getDestinationId());
  } catch (error) {
    // Observed Google behaviour for the intended unlinked form. Do not hide other errors.
    const message = String(error.message || error);
    if (/^(?:Exception: )?The form currently has no response destination\.$/.test(message)) return false;
    throw error;
  }
}

function reportDraft_(report) {
  // Owner-only execution output; never copy live URLs/identifiers into Git evidence.
  console.log(JSON.stringify(report, null, 2));
  return report;
}
