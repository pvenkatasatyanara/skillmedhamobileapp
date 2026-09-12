import { API_BASE_URL, ENDPOINTS, COMPILER_URL } from './config';
import { TESTS_QUERY, ONE_TEST_QUERY } from './queries';

/**
 * Thin fetch wrapper for the SkillMedha API.
 * Handles JSON encoding, bearer auth and error normalisation.
 */
async function request(path, { method = 'GET', body, token, base = API_BASE_URL } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Network error. Please check your connection and try again.');
  }

  let json = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (_) {
      json = null;
    }
  }

  if (!res.ok || (json && json.success === false)) {
    const message =
      (json && (json.err || json.error || json.message)) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json;
}

// Multipart upload helper (React Native FormData with { uri, name, type }).
async function upload(path, { files = {}, fields = {}, token, base = API_BASE_URL } = {}) {
  const form = new FormData();
  Object.entries(files).forEach(([key, f]) => {
    if (f) form.append(key, { uri: f.uri, name: f.name, type: f.type });
  });
  Object.entries(fields).forEach(([key, v]) => {
    if (v != null) form.append(key, String(v));
  });

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
  } catch (networkErr) {
    throw new Error('Network error while uploading. Please try again.');
  }

  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (_) {
      json = null;
    }
  }
  if (!res.ok || (json && json.success === false)) {
    const message =
      (json && (json.err || json.error || json.message)) || `Upload failed (${res.status})`;
    throw new Error(message);
  }
  return json;
}

export const api = {
  // ---- auth ----
  login(email, password) {
    return request(ENDPOINTS.login, { method: 'POST', body: { email, password } });
  },

  // ---- dashboard / profile ----
  getDashboardStats(token) {
    return request(ENDPOINTS.dashboardStats, { token });
  },
  getStudentCreds(token) {
    return request(ENDPOINTS.studentCreds, { token });
  },
  // Full student incl. appliedJobs (each with application status).
  getStudentProfile(token, { includeJobs = true } = {}) {
    const q = includeJobs ? '?includeJobs=true' : '';
    return request(`${ENDPOINTS.studentProfile}${q}`, { token });
  },
  updateStudent(token, aboutDetails) {
    return request(ENDPOINTS.updateStudent, { method: 'POST', token, body: aboutDetails });
  },

  // ---- learn ----
  getCoursesCombo(token, opts = {}) {
    return request(ENDPOINTS.coursesCombo, {
      method: 'POST',
      token,
      body: { pageNo: 1, searchTerm: '', category: '', difficulty: '', ...opts },
    });
  },
  getCourseDetail(token, courseId) {
    return request(`${ENDPOINTS.courseDetail}/${courseId}`, { token });
  },
  getAllCourses(opts = {}) {
    return request(ENDPOINTS.allCourses, { method: 'POST', body: { limit: 20, cursor: null, ...opts } });
  },
  getAllInternships(opts = {}) {
    return request(ENDPOINTS.allInternships, { method: 'POST', body: { limit: 20, cursor: null, ...opts } });
  },
  getAllWorkshops(opts = {}) {
    return request(ENDPOINTS.allWorkshops, { method: 'POST', body: { limit: 20, cursor: null, ...opts } });
  },

  // ---- practice ----
  getSubjects(token) {
    return request(ENDPOINTS.subjects, { token });
  },
  getSubjectsByType(token, type) {
    return request(`${ENDPOINTS.subjectsByType}/${type}`, { token });
  },
  getTopicsBySubject(token, subjectId) {
    return request(`${ENDPOINTS.topicsBySubject}/${subjectId}`, { token });
  },
  getSubtopicsByTopic(token, topicId) {
    return request(`${ENDPOINTS.subtopicsByTopic}/${topicId}`, { token });
  },
  getPracQuestions(token, { subjectId, topicId } = {}) {
    const q = new URLSearchParams();
    if (subjectId) q.append('subjectId', subjectId);
    if (topicId) q.append('topicId', topicId);
    return request(`${ENDPOINTS.pracQuestions}?${q.toString()}`, { token });
  },
  startPractice(token, body) {
    return request(ENDPOINTS.startPractice, { method: 'POST', token, body });
  },
  savePracResults(token, pracId, body) {
    return request(`${ENDPOINTS.savePracResults}/${pracId}`, { method: 'POST', token, body });
  },
  getStudentPracResults(token, userId) {
    return request(`${ENDPOINTS.studentPracResults}/${userId}`, { token });
  },
  getCompanyTests(token) {
    return request(ENDPOINTS.companyTests, { token });
  },
  getPracticeTopScores(token, testId) {
    return request(`${ENDPOINTS.practiceTopScores}/${testId}`, { token });
  },
  savePracticeTopScore(token, body) {
    return request(ENDPOINTS.practiceTopScores, { method: 'POST', token, body });
  },

  // ---- jobs ----
  getAllJobs(token, { page = 1, limit = 20, search = '' } = {}) {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) q.append('search', search);
    return request(`${ENDPOINTS.allJobs}?${q.toString()}`, { token });
  },
  applyJob(token, { jobId, studentId }) {
    const q = new URLSearchParams({ jobId: String(jobId), studentId: String(studentId) });
    return request(`${ENDPOINTS.applyJob}?${q.toString()}`, { token });
  },

  // ---- tests / assessments ----
  // My Tests (GraphQL assigned skill tests).
  getAssignedTests(token, { cursor = null, limit = 20, studentId, status } = {}) {
    return request(ENDPOINTS.gql, {
      method: 'POST',
      token,
      body: { query: TESTS_QUERY, variables: { cursor, limit, origin: 'student', studentId, status } },
    }).then((r) => r?.data?.tests || { tests: [], pageInfo: {} });
  },
  // single test with questions for the test-taking screen.
  getOneTest(token, testId) {
    return request(ENDPOINTS.gql, {
      method: 'POST',
      token,
      body: { query: ONE_TEST_QUERY, variables: { testId } },
    }).then((r) => {
      const t = r?.data?.test;
      if (t?.err) throw new Error(t.err);
      return t;
    });
  },
  // Job Assessments (REST).
  getAssignedAssessments(token, { page = 1, limit = 20 } = {}) {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return request(`${ENDPOINTS.assignedAssessments}?${q.toString()}`, { token });
  },
  getOneAssessment(token, assessmentId) {
    return request(`${ENDPOINTS.oneAssessment}/${assessmentId}`, { token });
  },
  saveTestProgress(token, body) {
    return request(ENDPOINTS.saveTestProgress, { method: 'POST', token, body });
  },
  addAttempts(token, studentId, body) {
    return request(`${ENDPOINTS.addAttempts}/${studentId}`, { method: 'POST', token, body });
  },
  getResultsData(token, progressId, body = {}) {
    return request(`${ENDPOINTS.getResultsData}/${progressId}`, { method: 'POST', token, body });
  },
  getRecentTestResults(token, studentId) {
    return request(`${ENDPOINTS.recentTestResults}/${studentId}`, { token });
  },

  // ---- proctoring ----
  detectLabels(token, body) {
    return request(ENDPOINTS.detectLabels, { method: 'POST', token, body });
  },
  compareFaces(token, body) {
    return request(ENDPOINTS.compareFaces, { method: 'POST', token, body });
  },
  // ---- live proctoring (Agora) ----
  createExamSession(token, testId, body) {
    return request(`/agora/create-exam-session/${testId}`, { method: 'POST', token, body });
  },
  joinAgoraSession(token, body) {
    return request('/agora/join-session', { method: 'POST', token, body });
  },
  processFrame(token, body) {
    return request('/agora/process-frame', { method: 'POST', token, body });
  },
  // Upload an image/audio/video file to blob storage. `task=transcribe` runs STT.
  uploadToS3(token, { file, bucketName = 'skillmedha-student-docs', task } = {}) {
    const q = new URLSearchParams({ bucketName });
    if (task) q.append('task', task);
    return upload(`${ENDPOINTS.uploadToS3}?${q.toString()}`, { files: { file }, token });
  },

  // ---- Talk to AI (mock interview) ----
  // Upload recorded audio and transcribe (Whisper). Returns transcription text.
  transcribeAudio(token, audioFile) {
    return this.uploadToS3(token, {
      file: audioFile,
      bucketName: 'skillmedha-speech',
      task: 'transcribe',
    });
  },
  // Upload recorded video (for replay). Returns { file: url, ... }.
  uploadSpeechVideo(token, videoFile) {
    return this.uploadToS3(token, { file: videoFile, bucketName: 'skillmedha-speech' });
  },
  // AI feedback on an interview answer. Returns { report, relevance,
  // grammarAndSpellingCheck, clarityAndStyleSuggestions, positiveFeedback, reviewedText }.
  checkEnglishText(token, { text, question, userType = 'student' }) {
    return request(ENDPOINTS.checkEnglishText, {
      method: 'POST',
      token,
      body: { text, question, userType },
    });
  },

  // ---- resume / ATS ----
  uploadResumePdf(token, { file, studentId }) {
    return upload(ENDPOINTS.uploadResume, {
      files: { resume: file },
      fields: { bucketName: 'skillmedha-uploads', uniqueName: studentId },
      token,
    });
  },
  atsUploadResume(token, { file, studentId }) {
    return upload(ENDPOINTS.atsUploadResume, { files: { resume: file }, fields: { studentId }, token });
  },
  atsGetCurrentResume(token, studentId) {
    return request(`${ENDPOINTS.atsCurrentResume}/${studentId}`, { token });
  },
  atsAnalyze(token, body) {
    return request(ENDPOINTS.atsAnalyzeExisting, { method: 'POST', token, body });
  },
  atsHistory(token, studentId, { page = 1, limit = 10 } = {}) {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return request(`${ENDPOINTS.atsHistory}/${studentId}?${q.toString()}`, { token });
  },
  atsGenerateUpdated(token, body) {
    return request(ENDPOINTS.atsGenerateUpdated, { method: 'POST', token, body });
  },

  // ---- coding compiler (Judge0) ----
  async runCode({ languageId, sourceCode, stdin = '' }) {
    // Judge0: create submission (base64) then poll.
    const create = await fetch(`${COMPILER_URL}/submissions/?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: languageId,
        source_code: b64(sourceCode),
        stdin: b64(stdin),
      }),
    });
    const text = await create.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error('Compiler error.');
    }
  },

  // ---- notices ----
  getNotices(token) {
    return request(ENDPOINTS.notices, { token });
  },
};

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// UTF-8 safe base64 encoder (React Native has no btoa/Buffer by default).
function b64(input) {
  const str = unescape(encodeURIComponent(input || ''));
  let out = '';
  let i = 0;
  while (i < str.length) {
    const c1 = str.charCodeAt(i++);
    const c2 = str.charCodeAt(i++);
    const c3 = str.charCodeAt(i++);
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (c2 >> 4);
    let e3 = ((c2 & 15) << 2) | (c3 >> 6);
    let e4 = c3 & 63;
    if (isNaN(c2)) e3 = e4 = 64;
    else if (isNaN(c3)) e4 = 64;
    out += B64_CHARS.charAt(e1) + B64_CHARS.charAt(e2) +
      (e3 === 64 ? '=' : B64_CHARS.charAt(e3)) +
      (e4 === 64 ? '=' : B64_CHARS.charAt(e4));
  }
  return out;
}

export default api;