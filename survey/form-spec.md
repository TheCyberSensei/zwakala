# Approved survey specification

Source: participant-supplied survey and approved refinements, 9 November 2026.

This JSON block is the authoritative execution input. Preserve its text, paragraph breaks and fixed-option order. Change survey design only with participant approval; regenerate SurveySpec.gs afterward. Native Other is enabled for Q1, Q2, Q3 and Q6. Q3 has a separate fixed Not sure option and retains a maximum of two selections. Native Other is rendered at Google's chosen position (normally last), including Q6; it is not duplicated in the fixed options.

No owner email, live form identifier, credentials or respondent data belongs in this specification. Affiliation is the first paragraph of the form description, not an extra item. All other description paragraphs follow unchanged.

```json
{
  "schemaVersion": 1,
  "title": "Digital Banking Confidence — Frontline Banking Staff Research Survey",
  "affiliation": "Independent Participant Research | Andela × OpenAI Codex Accelerator — Cape Town Cohort 2026",
  "description": "I'm participating in the Cape Town cohort of the Andela × OpenAI Codex Accelerator 2026, where I'm exploring how technology could help South Africans use digital financial services more confidently, independently and safely.\n\nThis survey seeks insights from banking professionals who assist customers with account opening, mobile banking and everyday digital transactions.\n\nYour frontline experience will help identify recurring customer difficulties, understand existing gaps and explore opportunities for technology-driven solutions.\n\nParticipation is voluntary.\n\nEstimated completion time: approximately 5 minutes, depending on the detail provided.\n\nResponses may be written in English, isiZulu or any other South African language. Mixing languages is welcome.\n\nDo not include customer names, banking details, confidential employer information or identifiable incidents.\n\nThe form does not intentionally collect names or email addresses.\n\nThis is independent participant research, not an official survey conducted by Andela, OpenAI or respondents' employers.",
  "confirmationMessage": "Thank you for contributing to this research.\n\nYour experience and insights will help us investigate ways to make digital financial services more accessible, practical and safe for South Africans.\n\nResearch conducted independently as part of participation in the Andela × OpenAI Codex Accelerator — Cape Town Cohort 2026.",
  "settings": {
    "collectEmail": false,
    "publishingSummary": false,
    "allowResponseEdits": false,
    "limitOneResponsePerUser": false,
    "shuffleQuestions": false,
    "isQuiz": false,
    "showLinkToRespondAgain": false,
    "acceptingResponses": false
  },
  "questions": [
    {
      "id": "Q1",
      "type": "MULTIPLE_CHOICE",
      "title": "What best describes your role?",
      "helpText": "",
      "required": true,
      "options": [
        "Account opening / sales",
        "Customer service / branch support",
        "Digital banking support",
        "Branch management / supervision"
      ],
      "other": true
    },
    {
      "id": "Q2",
      "type": "CHECKBOX",
      "title": "Which banking-app activities do customers most frequently need help understanding?",
      "helpText": "Select up to three.",
      "required": true,
      "options": [
        "Installing, registering or activating the banking app",
        "Logging in, passwords or account recovery",
        "Understanding OTPs and security verification",
        "Sending money or making payments (including PayShap)",
        "Adding beneficiaries",
        "Checking balances or transaction history",
        "Recognising suspicious messages or possible scams"
      ],
      "other": true,
      "maxSelections": 3
    },
    {
      "id": "Q3",
      "type": "CHECKBOX",
      "title": "Based on your experience, what most commonly makes digital banking difficult for customers?",
      "helpText": "Select up to two.",
      "required": true,
      "options": [
        "Unfamiliarity with smartphones or apps",
        "Difficulty understanding banking terminology",
        "Language barriers",
        "Fear of making mistakes or losing money",
        "Forgetting login details or instructions",
        "Complicated app navigation",
        "Connectivity or device limitations",
        "Not sure"
      ],
      "other": true,
      "maxSelections": 2
    },
    {
      "id": "Q4",
      "type": "MULTIPLE_CHOICE",
      "title": "How frequently do customers need additional assistance after their initial banking-app setup or demonstration?",
      "helpText": "",
      "required": true,
      "options": [
        "Very frequently",
        "Sometimes",
        "Rarely",
        "Almost never",
        "I don't have enough information to judge"
      ],
      "other": false
    },
    {
      "id": "Q5",
      "type": "MULTIPLE_CHOICE",
      "title": "Based on what you've observed, which approach helps customers understand and remember digital banking procedures best?",
      "helpText": "",
      "required": true,
      "options": [
        "A staff member explaining the steps verbally",
        "Watching someone demonstrate the process",
        "Practising the process themselves with guidance",
        "Written step-by-step instructions",
        "Short instructional videos",
        "A combination of approaches",
        "Not sure"
      ],
      "other": false
    },
    {
      "id": "Q6",
      "type": "CHECKBOX",
      "title": "Which languages do customers commonly prefer when receiving banking assistance?",
      "helpText": "Select all that apply.",
      "required": true,
      "options": [
        "isiZulu",
        "English",
        "isiXhosa",
        "Sesotho",
        "Afrikaans",
        "I haven't noticed a clear preference"
      ],
      "other": true
    },
    {
      "id": "Q7",
      "type": "PARAGRAPH_TEXT",
      "title": "What is one recurring customer difficulty you believe banks or technology providers could address better?",
      "helpText": "Please describe the problem and, if possible, what you think would help.\n\nWe are particularly interested in difficulties you encounter repeatedly, including those that may not be obvious to people who don't work directly with banking customers.\n\nYou may answer in any South African language or mix languages.\n\nDo not include customer-identifying information.",
      "required": true
    },
    {
      "id": "Q8",
      "type": "PARAGRAPH_TEXT",
      "title": "Your insights: What should we focus on when developing a solution?",
      "helpText": "We are exploring the possibility of developing an AI-driven solution that could help South Africans learn to use digital banking services more confidently, independently and safely, particularly people who struggle with unfamiliar technology or rely on others for assistance.\n\nWe have deliberately kept this survey short, but recognise that frontline banking professionals have valuable experiences that a short questionnaire cannot fully capture.\n\nBased on your experience, what problems should we prioritise, and what advice would you give us?\n\nWe welcome observations about:\n\n- Customer difficulties not covered in earlier questions.\n- Reasons existing banking support or education may fall short.\n- Ways customers could learn and remember digital banking procedures.\n- How technology or AI might help, or create additional problems.\n- Features, approaches or mistakes we should consider or avoid.\n\nPlease share as much detail as you feel would be useful.\n\nYou may answer in English, isiZulu or another language, including a mixture.\n\nDo not share confidential employer or customer information.",
      "required": true
    }
  ]
}
```
