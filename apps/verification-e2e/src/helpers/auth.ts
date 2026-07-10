export const API_URL = process.env['API_URL'] ?? 'http://127.0.0.1:3333';
export const TEST_TOKEN = 'tester-tok-9f3b1a2c';
export const authHeaders = { Authorization: `Bearer ${TEST_TOKEN}` };

export const qaTesterCredentials = {
  username: 'qa-tester',
  password: 'password123',
};
