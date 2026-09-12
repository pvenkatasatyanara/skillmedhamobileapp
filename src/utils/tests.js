// Helpers shared by the assessments list and the test-taking screen.
import { formatTestDuration, countTestQuestions } from './format';

// Duration label handling both the REST assessment shape (testDurationDisplay /
// duration.val1,val2) and the GraphQL test shape (time.testDuration...duration).
export function testDurationLabel(test) {
  const fromAssessment = formatTestDuration(test);
  if (fromAssessment) return fromAssessment;
  const dur =
    test?.time?.testDuration?.testDuration?.duration ||
    test?.time?.testDuration?.duration ||
    test?.duration;
  if (dur && (dur.val1 || dur.val2)) {
    const h = parseInt(dur.val1, 10) || 0;
    const m = parseInt(dur.val2, 10) || 0;
    const parts = [];
    if (h) parts.push(`${h} hr`);
    if (m) parts.push(`${m} min`);
    return parts.join(' ') || null;
  }
  return null;
}

// Total duration in seconds (for the countdown timer).
export function testDurationSeconds(test) {
  const dur =
    test?.time?.testDuration?.testDuration?.duration ||
    test?.time?.testDuration?.duration ||
    test?.duration ||
    (test?.testDurationDisplay && {
      val1: test.testDurationDisplay.hours,
      val2: test.testDurationDisplay.minutes,
    });
  const h = parseInt(dur?.val1, 10) || 0;
  const m = parseInt(dur?.val2, 10) || 0;
  const total = h * 3600 + m * 60;
  return total > 0 ? total : 30 * 60; // default 30 min
}

export function testQuestionCount(test) {
  if (typeof test?.totalQuestions === 'number' && test.totalQuestions > 0) return test.totalQuestions;
  return countTestQuestions(test);
}

// Whether a test's access window has closed.
export function isTestExpired(test) {
  const status = (test?.status || '').toLowerCase();
  if (status === 'expired' || status === 'completed') return true;
  const t = test?.time || {};
  const closing =
    t?.expiryDates?.accessClosingDate ||
    t?.expiryDates?.closingDate ||
    t?.testExpirationData?.accessClosingDate;
  if (closing) {
    const d = Date.parse(closing);
    if (!Number.isNaN(d) && d < Date.now()) return true;
  }
  if (test?.endDate) {
    const d = Date.parse(test.endDate);
    if (!Number.isNaN(d) && d < Date.now()) return true;
  }
  return false;
}

export function isTestActive(test) {
  return !isTestExpired(test) && (test?.status || 'active').toLowerCase() === 'active';
}

export default { testDurationLabel, testDurationSeconds, testQuestionCount, isTestExpired, isTestActive };