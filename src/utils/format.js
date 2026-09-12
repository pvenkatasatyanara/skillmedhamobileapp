// Small formatting helpers used across screens.

// Strip HTML tags & decode a few common entities from API rich-text fields.
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/['"]{2,}/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function initialsOf(nameOrUser) {
  let str = '';
  if (typeof nameOrUser === 'string') str = nameOrUser;
  else if (nameOrUser) {
    const f = (nameOrUser.firstName || '').trim();
    const l = (nameOrUser.lastName || '').trim();
    str = `${f} ${l}`.trim() || nameOrUser.userName || nameOrUser.email || '';
  }
  if (!str) return 'S';
  return str
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function fullNameOf(user) {
  return (
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    user?.userName ||
    'Student'
  );
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

// Format a value that may be LPA numeric or a string.
export function formatCtc(ctc) {
  if (ctc == null || ctc === '') return null;
  const num = Number(ctc);
  if (!Number.isNaN(num)) return `${num} LPA`;
  return String(ctc);
}

// Relative-ish date from ms timestamp or date string.
export function timeAgo(input) {
  if (!input) return '';
  const t = typeof input === 'number' ? input : Date.parse(input);
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const day = 86400000;
  if (diff < 3600000) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
  if (diff < day) return `${Math.round(diff / 3600000)}h ago`;
  if (diff < 7 * day) return `${Math.round(diff / day)}d ago`;
  return new Date(t).toLocaleDateString();
}

// Human-friendly duration for an assigned assessment.
export function formatTestDuration(test) {
  const d = test?.testDurationDisplay;
  if (d && (d.hours || d.minutes)) {
    const parts = [];
    if (d.hours) parts.push(`${d.hours} hr`);
    if (d.minutes) parts.push(`${d.minutes} min`);
    return parts.join(' ');
  }
  const val = test?.duration;
  if (val && (val.val1 || val.val2)) return `${val.val1}h ${val.val2}m`;
  return null;
}

// Total number of questions on an assessment (best effort across shapes).
export function countTestQuestions(test) {
  // Prefer the populated (deduped) questions list; `questionIds` can contain
  // duplicate entries which would inflate the count.
  if (Array.isArray(test?.questions) && test.questions.length) return test.questions.length;
  if (Array.isArray(test?.questionIds) && test.questionIds.length) {
    return new Set(test.questionIds).size;
  }
  if (Array.isArray(test?.skills)) {
    const sum = test.skills.reduce((acc, s) => acc + (Number(s.numQues) || 0), 0);
    if (sum) return sum;
  }
  return null;
}

// Score summary line for a completed test result.
export function formatScore(result) {
  const sd = result?.scoreData || {};
  const correct = Number(sd.correctQues) || 0;
  const incorrect = Number(sd.incorrectQues) || 0;
  const notAnswered = Number(sd.notAnswered) || 0;
  const total = correct + incorrect + notAnswered;
  const final = sd.finalScore;
  const pct = total > 0 ? Math.round((correct / total) * 100) : null;
  return { correct, total, final, pct };
}

// Deterministic gradient/color pick for placeholder thumbnails.
const THUMB_COLORS = [
  ['#a5b4fc', '#6366f1'],
  ['#fbcfe8', '#ec4899'],
  ['#bbf7d0', '#22c55e'],
  ['#fde68a', '#f59e0b'],
  ['#bae6fd', '#0ea5e9'],
  ['#ddd6fe', '#8b5cf6'],
];
export function thumbColor(seed = 0) {
  const i = Math.abs(typeof seed === 'string' ? hashStr(seed) : seed) % THUMB_COLORS.length;
  return THUMB_COLORS[i];
}
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h;
}