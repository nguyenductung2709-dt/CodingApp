Key design decisions:

APIs:
- POST /grade: handle grading the solution of user
- POST /submissions: handle adding submissions to the database
- GET /submissions: get all submissions
- GET /submissions/:id: get all submissions for an assignment
- GET /assignments: handle get all the assignments
- GET /completed/:id: get all completed submissions of a user

UI design decisions:
- Using GET request to /api/assignments to get all the assignments
- Grading a solution: 
    + If code is already submitted => search in DB => return old grader_feedback
    + If code is not submitted before => POST to /grade => receive a response => after UI receive message through socket, POST to /submissions so save the submission => If answer is wrong, stayed at the current question. If answer is correct then icon is updated and move to the next question
- Get points:
    + Points is saved into localStorage, if there is not points previously => fetch /completed/userID to check how many exercises completed 
    => determine points
    + After each submission, fetch /completed/userID again to update point. This is slow but necessary because 1 exercise can be completed 
    correctly with many syntax (not the same code) => we cannot update the points based on each correct submission

