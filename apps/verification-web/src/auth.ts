export interface User {
  username: string;
  password: string;
  token: string;
}

export const USERS: User[] = [
  { username: 'qa-tester', password: 'password123', token: 'tester-tok-9f3b1a2c' },
  { username: 'admin', password: 'admin123', token: 'admin-tok-7e5d4c8a' },
];

const STORAGE_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function login(username: string, password: string): string | null {
  const user = USERS.find((u) => u.username === username);
  if (!user) return null;
  if (user.password !== password) return null;
  setToken(user.token);
  return user.token;
}
