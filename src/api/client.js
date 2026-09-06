import { API_BASE_URL, ENDPOINTS } from './config';

/**
 * Thin fetch wrapper for the SkillMedha API.
 * Handles JSON encoding, bearer auth and error normalisation.
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
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

  // ---- learn ----
  getCoursesCombo(token, opts = {}) {
    return request(ENDPOINTS.coursesCombo, {
      method: 'POST',
      token,
      body: { pageNo: 1, searchTerm: '', category: '', difficulty: '', ...opts },
    });
  },
  // Full course with nested sections[].topics[] (videos, resources, progress).
  getCourseDetail(token, courseId) {
    return request(`${ENDPOINTS.courseDetail}/${courseId}`, { token });
  },
  getAllCourses(opts = {}) {
    return request(ENDPOINTS.allCourses, {
      method: 'POST',
      body: { limit: 20, cursor: null, ...opts },
    });
  },
  getAllInternships(opts = {}) {
    return request(ENDPOINTS.allInternships, {
      method: 'POST',
      body: { limit: 20, cursor: null, ...opts },
    });
  },
  getAllWorkshops(opts = {}) {
    return request(ENDPOINTS.allWorkshops, {
      method: 'POST',
      body: { limit: 20, cursor: null, ...opts },
    });
  },

  // ---- practice ----
  getSubjects(token) {
    return request(ENDPOINTS.subjects, { token });
  },

  // ---- jobs ----
  getAllJobs(token, { page = 1, limit = 20, search = '' } = {}) {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) q.append('search', search);
    return request(`${ENDPOINTS.allJobs}?${q.toString()}`, { token });
  },

  // ---- tests / assessments ----
  getAssignedAssessments(token, { page = 1, limit = 20 } = {}) {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return request(`${ENDPOINTS.assignedAssessments}?${q.toString()}`, { token });
  },
  getRecentTestResults(token, studentId) {
    return request(`${ENDPOINTS.recentTestResults}/${studentId}`, { token });
  },

  // ---- notices ----
  getNotices(token) {
    return request(ENDPOINTS.notices, { token });
  },
};

export default api;