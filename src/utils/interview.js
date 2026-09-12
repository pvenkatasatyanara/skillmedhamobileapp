// On-device fallback analysis for the Talk to AI mock interview, used when no
// transcription/AI backend endpoint is configured or the upload fails. It does
// NOT perform real speech-to-text (that requires a backend/STT service); it
// returns coaching-style feedback derived from the answer length so the feature
// still gives the user something actionable end-to-end.

const GENERIC_SUGGESTIONS = [
  'Open with a concise, direct answer before adding detail.',
  'Use the STAR method (Situation, Task, Action, Result) for examples.',
  'Quantify impact where possible (e.g. "cut load time by 30%").',
  'Reduce filler words like "um", "like" and "you know".',
  'Keep eye contact with the camera and maintain steady pacing.',
  'End on a positive, forward-looking note.',
];

export function localInterviewAnalysis({ seconds = 0 } = {}) {
  // Reward answers that use a reasonable amount of the available time.
  const usage = Math.min(seconds / 45, 1); // ~45s is a solid answer length
  const base = 55 + Math.round(usage * 35); // 55-90
  const score = Math.max(40, Math.min(95, base));

  let report;
  if (seconds < 12) {
    report =
      'Your answer was quite short. Interviewers usually expect 45-90 seconds so you can give ' +
      'context and a concrete example. Try expanding with a specific situation and the result.';
  } else if (seconds > 55) {
    report =
      'You used the full time - good detail, but watch for rambling. Tighten the structure so the ' +
      'key point lands in the first 10-15 seconds, then support it with one strong example.';
  } else {
    report =
      'Good length and pacing. You had room to give context and an example. Focus next on a crisp ' +
      'opening line and quantifying the outcome to make the answer more memorable.';
  }

  // Pick 4 rotating suggestions.
  const start = seconds % GENERIC_SUGGESTIONS.length;
  const suggestions = Array.from({ length: 4 }, (_, i) =>
    GENERIC_SUGGESTIONS[(start + i) % GENERIC_SUGGESTIONS.length]
  );

  return {
    transcript: '',
    score,
    report,
    suggestions,
    offline: true,
  };
}

export default { localInterviewAnalysis };