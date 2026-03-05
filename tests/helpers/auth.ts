import { Page, expect } from '@playwright/test';

/**
 * Authentication Helpers
 * Provides utilities for logging in and managing auth state
 */

/**
 * Login user via UI
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Navigate to login page
  await page.goto('/login');

  // Fill email
  await page.fill('input[type="email"]', email);

  // Fill password
  await page.fill('input[type="password"]', password);

  // Click login button
  await page.click('button:has-text("Вход")');

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });

  // Verify we're logged in
  await expect(page).toHaveURL('/dashboard');
}

/**
 * Login user via API and get token
 */
export async function loginViaAPI(
  baseURL: string,
  email: string,
  password: string
): Promise<string> {
  const response = await fetch(`${baseURL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.session.access_token;
}

/**
 * Signup user via UI
 */
export async function signupViaUI(
  page: Page,
  email: string,
  password: string,
  fullName: string,
  role: 'customer' | 'provider' = 'customer'
): Promise<void> {
  // Navigate to signup page
  await page.goto('/signup');

  // Fill email
  await page.fill('input[type="email"]', email);

  // Fill password
  await page.fill('input[type="password"]', password);

  // Fill full name
  await page.fill('input[placeholder*="Име"]', fullName);

  // Select role
  await page.click(`input[value="${role}"]`);

  // Click signup button
  await page.click('button:has-text("Регистрация")');

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });

  // Verify we're logged in
  await expect(page).toHaveURL('/dashboard');
}

/**
 * Signup user via API
 */
export async function signupViaAPI(
  baseURL: string,
  email: string,
  password: string,
  fullName: string,
  role: 'customer' | 'provider' = 'customer'
): Promise<{ userId: string; token: string }> {
  const response = await fetch(`${baseURL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
      role,
    }),
  });

  if (!response.ok) {
    throw new Error(`Signup failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    userId: data.user.id,
    token: data.session.access_token,
  };
}

/**
 * Logout user via UI
 */
export async function logoutViaUI(page: Page): Promise<void> {
  // Click user menu
  await page.click('button[aria-label="User menu"]');

  // Click logout
  await page.click('a:has-text("Изход")');

  // Wait for navigation to home
  await page.waitForURL('/', { timeout: 10000 });

  // Verify we're logged out
  await expect(page).toHaveURL('/');
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Try to navigate to dashboard
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // If we're on dashboard, we're logged in
    return page.url().includes('/dashboard');
  } catch {
    return false;
  }
}

/**
 * Get auth token from localStorage
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      return parsed.session?.access_token || null;
    }
    return null;
  });
}

/**
 * Set auth token in localStorage
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.evaluate((token) => {
    const auth = {
      session: {
        access_token: token,
      },
    };
    localStorage.setItem('auth', JSON.stringify(auth));
  }, token);
}

/**
 * Clear auth state
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth');
    sessionStorage.clear();
  });
}

/**
 * Wait for auth to be ready
 */
export async function waitForAuthReady(page: Page): Promise<void> {
  // Wait for auth context to be loaded
  await page.waitForFunction(
    () => {
      const auth = localStorage.getItem('auth');
      return auth !== null;
    },
    { timeout: 5000 }
  );
}

/**
 * Get current user info
 */
export async function getCurrentUser(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      return parsed.user || null;
    }
    return null;
  });
}
