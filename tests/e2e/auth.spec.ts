import { test, expect } from '@playwright/test';
import {
  signupViaUI,
  loginViaUI,
  logoutViaUI,
  isLoggedIn,
} from '../helpers/auth';
import { generateTestUser } from '../helpers/testData';

test.describe('Authentication', () => {
  test('should signup as customer', async ({ page }) => {
    const testUser = generateTestUser('customer');

    await signupViaUI(
      page,
      testUser.email,
      testUser.password,
      testUser.fullName,
      'customer'
    );

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify user is logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('should signup as provider', async ({ page }) => {
    const testUser = generateTestUser('provider');

    await signupViaUI(
      page,
      testUser.email,
      testUser.password,
      testUser.fullName,
      'provider'
    );

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify user is logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('should login with valid credentials', async ({ page }) => {
    const testUser = generateTestUser('customer');

    // First signup
    await signupViaUI(
      page,
      testUser.email,
      testUser.password,
      testUser.fullName,
      'customer'
    );

    // Logout
    await logoutViaUI(page);

    // Verify we're logged out
    await expect(page).toHaveURL('/');

    // Login again
    await loginViaUI(page, testUser.email, testUser.password);

    // Verify we're logged in
    await expect(page).toHaveURL('/dashboard');
  });

  test('should not login with invalid password', async ({ page }) => {
    const testUser = generateTestUser('customer');

    // First signup
    await signupViaUI(
      page,
      testUser.email,
      testUser.password,
      testUser.fullName,
      'customer'
    );

    // Logout
    await logoutViaUI(page);

    // Try to login with wrong password
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'WrongPassword123');
    await page.click('button:has-text("Вход")');

    // Should show error
    await expect(page.locator('text=Невалидни данни')).toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should not login with non-existent email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nonexistent@test.example.com');
    await page.fill('input[type="password"]', 'Test@1234567');
    await page.click('button:has-text("Вход")');

    // Should show error
    await expect(page.locator('text=Невалидни данни')).toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    const testUser = generateTestUser('customer');

    // Signup
    await signupViaUI(
      page,
      testUser.email,
      testUser.password,
      testUser.fullName,
      'customer'
    );

    // Verify we're logged in
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await logoutViaUI(page);

    // Verify we're logged out
    await expect(page).toHaveURL('/');

    // Verify we can't access dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should not allow duplicate email signup', async ({ page }) => {
    const testUser = generateTestUser('customer');

    // First signup
    await signupViaUI(
      page,
      testUser.email,
      testUser.password,
      testUser.fullName,
      'customer'
    );

    // Logout
    await logoutViaUI(page);

    // Try to signup with same email
    await page.goto('/signup');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'Test@1234567');
    await page.fill('input[placeholder*="Име"]', 'Another User');
    await page.click('input[value="customer"]');
    await page.click('button:has-text("Регистрация")');

    // Should show error
    await expect(page.locator('text=Имейлът вече е регистриран')).toBeVisible();

    // Should still be on signup page
    await expect(page).toHaveURL('/signup');
  });

  test('should persist auth across page reload', async ({ page }) => {
    const testUser = generateTestUser('customer');

    // Signup
    await signupViaUI(
      page,
      testUser.email,
      testUser.password,
      testUser.fullName,
      'customer'
    );

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');

    // Verify user is logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });
});
