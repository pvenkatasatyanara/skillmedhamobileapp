// Base URL of the deployed SkillMedha API (Azure Container Apps).
// Routes are mounted at the root ("/") - there is no /api/v1 prefix.
export const API_BASE_URL =
  'https://skillmedha-api.gentlebeach-dbf57cdd.westus2.azurecontainerapps.io';

export const ENDPOINTS = {
  // auth
  login: '/loginStudent',
  // dashboard / profile
  dashboardStats: '/dashboard/stats',
  studentCreds: '/getStudentCreds',
  studentProgress: '/getStudentProgress',
  // learn
  coursesCombo: '/getAllCoursesCombo',
  courseDetail: '/getOneInternshipAuth', // + /:id
  allCourses: '/getAllCourses',
  allInternships: '/getAllInternships',
  allWorkshops: '/getAllWorkshops',
  // practice
  subjects: '/subjects',
  // jobs
  allJobs: '/getAllJobs',
  // tests / assessments
  assignedAssessments: '/getAssignedAssessments',
  recentTestResults: '/assessments/getRecentTestResults', // + /:studentId
  // notices
  notices: '/getNoticeByStudent',
  // public
  publicStats: '/api/public/stats',
  // Talk to AI - mock-interview transcription + feedback.
  // The recorded answer is uploaded here (multipart/form-data) and the backend
  // is expected to return { transcript, score, report/feedback, suggestions[] }.
  // Point this at your own transcription/LLM service (e.g. Whisper + GPT, Azure
  // Speech, or a custom endpoint). Leave as `null` to use the on-device
  // heuristic fallback so the feature still works without a backend.
  interviewAnalyze: null, // e.g. '/analyzeInterviewAnswer'
};

export default { API_BASE_URL, ENDPOINTS };