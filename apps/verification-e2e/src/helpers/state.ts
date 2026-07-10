import { expect, type APIRequestContext } from '@playwright/test';

import { API_URL, authHeaders } from './auth';

export async function resetState(request: APIRequestContext): Promise<void> {
  const response = await request.post(`${API_URL}/api/reset`, { headers: authHeaders });
  expect(response.ok()).toBeTruthy();
}
