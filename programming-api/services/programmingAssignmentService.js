import { sql } from "../database/database.js";

const findAll = async () => {
  return await sql`SELECT * FROM programming_assignments;`;
};

const findSpecificAssignment = async(id) => {
  return await sql`SELECT * FROM programming_assignments WHERE id = ${id};`;
}

const findAllSubmissions = async() => {
  return await sql`SELECT * FROM programming_assignment_submissions;`;
};

const findSpecificSubmissions = async(assignmentId) => {
  return await sql`SELECT * FROM programming_assignment_submissions WHERE programming_assignment_id = ${assignmentId};`;
}

const findSpecificSubmissionsOfUser = async(userId, assignmentId) => {
  return await sql`SELECT * FROM programming_assignment_submissions WHERE user_uuid = ${userId} AND programming_assignment_id = ${assignmentId};`;
}

const findSubmissionOfUser = async(userId) => {
  return await sql`SELECT * FROM programming_assignment_submissions WHERE user_uuid = ${userId};`;
}

const postSubmission = async(assignmentId, code, user_uuid) => {
  return await sql`INSERT INTO programming_assignment_submissions (programming_assignment_id, code, user_uuid) VALUES (${assignmentId}, ${code}, ${user_uuid})`;
}

const updateSubmissionStatus = async(id, gradingStatus, grader_feedback, correct) => {
  return await sql`UPDATE programming_assignment_submissions SET status = ${gradingStatus}, grader_feedback = ${grader_feedback}, correct = ${correct} WHERE id = ${id};`;
}

const findSubmission = async(assignmentId, userId, code) => {
  return await sql`SELECT * FROM programming_assignment_submissions WHERE programming_assignment_id = ${assignmentId} AND user_uuid = ${userId} AND code = ${code};`;

}

export { findSubmissionOfUser, findSubmission, findAll, findSpecificAssignment, findAllSubmissions, findSpecificSubmissions, postSubmission, findSpecificSubmissionsOfUser, updateSubmissionStatus };
