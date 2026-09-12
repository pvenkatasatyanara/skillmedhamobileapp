// Base URL of the deployed SkillMedha API (Azure Container Apps).
// In the web app these are split across several NEXT_PUBLIC_* hosts
// (restUrl, aiUrl, studentUrl, gqlUrl, assessmentGqlUrl); in this deployment
// they are all served by the same container, so we use one base URL.
export const API_BASE_URL =
  'https://skillmedha-api.gentlebeach-dbf57cdd.westus2.azurecontainerapps.io';

export const ENDPOINTS = {
  // auth
  login: '/loginStudent',
  // dashboard / profile
  dashboardStats: '/dashboard/stats',
  studentCreds: '/getStudentCreds',
  studentProfile: '/', // GET /?includeJobs=true -> full student incl. appliedJobs
  studentProgress: '/getStudentProgress',
  updateStudent: '/updateStudent',
  // learn
  coursesCombo: '/getAllCoursesCombo',
  courseDetail: '/getOneInternshipAuth', // + /:id
  allCourses: '/getAllCourses',
  allInternships: '/getAllInternships',
  allWorkshops: '/getAllWorkshops',
  // practice
  subjects: '/subjects',
  subjectsByType: '/subjects/type', // + /:type
  topicsBySubject: '/topics/subject', // + /:subjectId
  subtopicsByTopic: '/subtopics/topic', // + /:topicId
  pracQuestions: '/getpracquestions',
  startPractice: '/startPractice',
  savePracResults: '/savePracResults', // + /:pracId
  studentPracResults: '/getStudentPracResults', // + /:userId
  companyTests: '/company-tests',
  practiceTopScores: '/practice/top-scores', // GET /:testId, POST to save
  compilerRun: '/compiler/run',
  // jobs / placements
  allJobs: '/getAllJobs',
  applyJob: '/applyJob', // GET ?jobId=&studentId=
  oneJob: '/getOneJob', // POST /:jobId
  // tests / assessments
  gql: '/gql', // GraphQL (My Tests + single test)
  assignedAssessments: '/getAssignedAssessments',
  oneAssessment: '/getOneAssessmentFromStudent', // + /:assessmentId
  jobAssessmentResults: '/getJobAssessmentResultsForStudent', // + /:assessmentId/:studentId
  saveTestProgress: '/assessments/saveTestProgress',
  updateProgress: '/assessments/updateProgress', // + /:progressId
  addAttempts: '/assessments/addAttempts', // + /:studentId
  getResultsData: '/assessments/getResultsData', // + /:id
  markOneTimeResultViewed: '/assessments/markOneTimeResultViewed', // + /:id
  recentTestResults: '/assessments/getRecentTestResults', // + /:studentId
  // proctoring
  detectLabels: '/proctor/detectLabels',
  compareFaces: '/proctor/compareFaces',
  indexFaces: '/proctor/indexFaces',
  uploadToS3: '/uploadToS3', // + ?bucketName=&task=
  // resume / ATS
  atsUploadResume: '/api/upload-resume',
  atsCurrentResume: '/api/resume', // + /:studentId
  atsAnalyzeExisting: '/ats/analyze-existing',
  atsHistory: '/ats/history', // + /:studentId
  atsAnalysis: '/ats/analysis', // + /:analysisId
  atsGenerateUpdated: '/ats/generate-updated-resume',
  atsFeedback: '/ats/feedback',
  uploadResume: '/upload-resume', // resume builder PDF upload
  // AI (interview feedback, summaries)
  checkEnglishText: '/ai/checkEnglishText',
  rephraseSummary: '/ai/rephraseSummary',
  generateExplanation: '/ai/generateExp',
  // notices
  notices: '/getNoticeByStudent',
  // public
  publicStats: '/api/public/stats',
};

// Judge0-compatible compiler for coding questions (used in tests & practice).
export const COMPILER_URL = 'https://compiler.skillmedha.com';

export default { API_BASE_URL, ENDPOINTS, COMPILER_URL };