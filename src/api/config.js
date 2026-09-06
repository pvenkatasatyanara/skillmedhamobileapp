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
};

export default { API_BASE_URL, ENDPOINTS };