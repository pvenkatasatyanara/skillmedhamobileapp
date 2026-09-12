// Normalises test questions from both the GraphQL test shape and the REST job
// assessment shape into a flat, render-ready list. Comprehension questions are
// flattened into their sub-questions (each scored independently by the server).
import { stripHtml } from './format';

// Judge0 language ids for coding questions.
export const LANGUAGES = [
  { id: 71, name: 'Python' },
  { id: 63, name: 'JavaScript' },
  { id: 62, name: 'Java' },
  { id: 54, name: 'C++' },
  { id: 50, name: 'C' },
];

function optionList(questionContent = {}) {
  return Object.keys(questionContent)
    .filter((k) => /^option\s*\d+/i.test(k))
    .map((k) => ({ key: k.toLowerCase().replace(/\s+/g, ' ').trim(), text: stripHtml(questionContent[k]) }))
    .filter((o) => o.text);
}

function kindOf(q) {
  const t = String(q.questionType || '').toLowerCase();
  const ans = q.answer || {};
  if (t.includes('coding') || ans.coding) return 'coding';
  if (t.includes('multiple') || ans.multipleChoice) return 'multiple';
  if (t.includes('true') || ans.trueFalse) return 'truefalse';
  if (t.includes('fill') || t.includes('short') || t.includes('paragraph') || t.includes('text') || ans.shortPara)
    return 'text';
  const resType = q.resources?.type;
  if (resType === 'audio') return 'audio';
  if (resType === 'video') return 'video';
  if (t.includes('single') || ans.singleChoice) return 'single';
  // default: if it has options, treat as single choice.
  return optionList(q.questionContent).length ? 'single' : 'text';
}

function normalizeOne(q, extra = {}) {
  const qc = q.questionContent || {};
  const kind = kindOf(q);
  return {
    _id: q._id,
    kind,
    question: stripHtml(qc.question || q.question || ''),
    options: optionList(qc),
    resources: q.resources || null,
    scoreSettings: q.scoreSettings,
    answer: q.answer || null,
    explanation: stripHtml(String(q.answer?.explanation || '').replace(/^"|"$/g, '')),
    ...extra,
  };
}

// Correct option keys / value for a normalised question (client-side practice).
export function correctAnswer(q) {
  const a = q?.answer || {};
  if (a.multipleChoice && typeof a.multipleChoice === 'object') {
    return Object.keys(a.multipleChoice).filter((k) => a.multipleChoice[k]).map((k) => k.toLowerCase());
  }
  if (a.singleChoice && typeof a.singleChoice === 'object') {
    return [Object.keys(a.singleChoice)[0]?.toLowerCase()].filter(Boolean);
  }
  if (a.trueFalse != null) return [String(a.trueFalse).toLowerCase()];
  return [];
}

// whether the selected answers are correct for a question (choice types only).
export function isAnswerCorrect(q, selected = []) {
  const correct = correctAnswer(q);
  if (!correct.length) return null; // not auto-scorable (text/coding)
  const sel = (selected || []).map((x) => String(x).toLowerCase());
  if (q.kind === 'multiple') {
    return correct.length === sel.length && correct.every((k) => sel.includes(k));
  }
  return sel.length === 1 && correct.includes(sel[0]);
}

export function normalizeQuestions(test = {}) {
  const raw = test.questions || test.questionsData || [];
  const out = [];
  raw.forEach((q) => {
    // Comprehension parent -> flatten sub-questions.
    if (Array.isArray(q.questionContentArr) && q.questionContentArr.length) {
      const passage = stripHtml(q.comprehensionText || q.compText || '');
      q.questionContentArr.forEach((sub) => {
        out.push(
          normalizeOne(sub, {
            comprehension: passage,
            comprehensionId: q._id,
          })
        );
      });
      return;
    }
    out.push(normalizeOne(q));
  });
  // De-dupe by _id (job assessments sometimes repeat questionIds).
  const seen = new Set();
  return out.filter((q) => {
    if (!q._id || seen.has(q._id)) return false;
    seen.add(q._id);
    return true;
  });
}

export default { normalizeQuestions, LANGUAGES };