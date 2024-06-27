import http from 'k6/http';
import crypto from 'k6/crypto';

export const options = {
  vus: 10,
  duration: '10s',
};

export default function () {
  const userId = crypto.randomBytes(16).toString('hex'); 
  const totalExercises = 3;
  const assignmentId = (Math.floor(Math.random() * totalExercises) + 1).toString();

  const code = 'def hello(): pass'

  const data = {
    userId,
    assignmentId,
    code
  };

  http.post('http://localhost:7800/api/grade', JSON.stringify(data));
}