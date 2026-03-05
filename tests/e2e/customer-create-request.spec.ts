import { test, expect } from '@playwright/test';
import { signupViaUI } from '../helpers/auth';
import { generateTestUser, generateTestRequest } from '../helpers/testData';

test.describe('Customer - Create Request', () => {
  test('should create a new request', async ({ page }) => {
    // Signup as customer
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Navigate to create request
    await page.click('a:has-text("Нова заявка")');
    await expect(page).toHaveURL('/requests/new');

    // Fill request details
    await page.fill('textarea[placeholder*="Описание"]', 'Need house cleaning');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street, Sofia');
    await page.fill('input[type="number"]', '50');

    // Submit form
    await page.click('button:has-text("Създай заявка")');

    // Should be redirected to request detail
    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Verify request details are shown
    await expect(page.locator('text=Need house cleaning')).toBeVisible();
    await expect(page.locator('text=Почистване')).toBeVisible();
    await expect(page.locator('text=София')).toBeVisible();
    await expect(page.locator('text=50')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Signup as customer
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Navigate to create request
    await page.click('a:has-text("Нова заявка")');
    await expect(page).toHaveURL('/requests/new');

    // Try to submit without filling fields
    await page.click('button:has-text("Създай заявка")');

    // Should show validation errors
    await expect(page.locator('text=Полето е задължително')).toBeVisible({
      timeout: 5000,
    });

    // Should still be on create request page
    await expect(page).toHaveURL('/requests/new');
  });

  test('should list created requests on dashboard', async ({ page }) => {
    // Signup as customer
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Create a request
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Test request');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '50');
    await page.click('button:has-text("Създай заявка")');

    // Wait for redirect
    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Navigate to dashboard
    await page.click('a:has-text("Мои заявки")');

    // Should see the created request
    await expect(page.locator('text=Test request')).toBeVisible();
  });

  test('should show request status as pending', async ({ page }) => {
    // Signup as customer
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Create a request
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Test request');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '50');
    await page.click('button:has-text("Създай заявка")');

    // Wait for redirect
    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Verify status is pending
    await expect(page.locator('text=Очаква')).toBeVisible();
  });

  test('should allow editing pending request', async ({ page }) => {
    // Signup as customer
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Create a request
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Original description');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '50');
    await page.click('button:has-text("Създай заявка")');

    // Wait for redirect
    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Click edit button
    await page.click('button:has-text("Редактирай")');

    // Update description
    await page.fill('textarea[placeholder*="Описание"]', 'Updated description');
    await page.click('button:has-text("Запази")');

    // Verify update
    await expect(page.locator('text=Updated description')).toBeVisible();
  });

  test('should allow canceling pending request', async ({ page }) => {
    // Signup as customer
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Create a request
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Test request');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '50');
    await page.click('button:has-text("Създай заявка")');

    // Wait for redirect
    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Click cancel button
    await page.click('button:has-text("Отмени")');

    // Confirm cancellation
    await page.click('button:has-text("Да, отмени")');

    // Should be redirected to requests list
    await page.waitForURL(/\/requests/, { timeout: 10000 });

    // Verify request is no longer visible or marked as cancelled
    await expect(page.locator('text=Test request')).not.toBeVisible();
  });
});
