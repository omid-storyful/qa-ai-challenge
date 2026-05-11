import React, { useState } from 'react';
import { login } from './auth';

interface Props {
  onLoggedIn: () => void;
}

export function LoginPage({ onLoggedIn }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = login(username.trim(), password);
    if (!token) {
      setError('Invalid username or password.');
      return;
    }
    setError(null);
    onLoggedIn();
  }

  return (
    <div className="wrap">
      <header>
        <h1>Content Verification Workbench</h1>
        <p className="tagline">Please sign in to continue.</p>
      </header>

      <section className="input">
        <form onSubmit={onSubmit} aria-label="Sign in">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <div className="actions">
            <button type="submit">Sign in</button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
