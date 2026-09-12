// GraphQL operations for the assessments service (served at POST /gql).
// Ported (trimmed) from the web app's utils/graphql_quries/assessments.js.

export const TESTS_QUERY = `
query Tests($cursor: ID, $limit: Int, $status: String, $origin: String, $studentId: String) {
  tests(cursor: $cursor, limit: $limit, status: $status, origin: $origin, studentId: $studentId) {
    pageInfo { hasNextPage }
    tests {
      _id
      title
      shortDescription
      longDescription
      access
      logo
      status
      testType
      time
      startPage
      grading
      snapshotTechnology
      honestRespondent
      facialRecognitionTechnology
      testEvaluationType
      attemptGeneration
      totalMarks
      totalQuestions
      totalTime
      startDate
      endDate
      category { _id type name }
      enrolledStudents {
        _id
        progress { _id testId scoreData attemptGeneration }
      }
    }
  }
}
`;

// Full single test with questions + answers for the test-taking screen.
export const ONE_TEST_QUERY = `
query Test($testId: String) {
  test(id: $testId) {
    ... on Test {
      _id
      title
      shortDescription
      longDescription
      access
      startPage
      grading
      snapshotTechnology
      honestRespondent
      facialRecognitionTechnology
      time
      status
      testType
      totalMarks
      totalQuestions
      totalTime
      startDate
      endDate
      category { _id type name }
      attemptGeneration
      questions {
        ... on Questions {
          _id
          questionType
          questionContent
          sno
          questionCategory { _id type name }
          questionScore
          scoreSettings
          answer
          resources
        }
        ... on ComprehensionQuestions {
          _id
          questionType
          comprehensionText
          resources
          questionContentArr {
            _id
            questionType
            questionContent
            sno
            questionCategory { _id type name }
            questionScore
            scoreSettings
            answer
          }
          sno
          questionScore
          scoreSettings
          answer
          tags { _id type name }
        }
      }
      ... on err { err }
    }
  }
}
`;

export default { TESTS_QUERY, ONE_TEST_QUERY };