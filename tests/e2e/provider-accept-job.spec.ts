import { test, expect } from '@playwright/test';
import { signupViaUI } from '../helpers/auth';
import { generateTestUser } from '../helpers/testData';

test.describe('Provider - Accept Job', () => {
  test('should view available requests', async ({ page, context }) => {
    // Create customer and request
    const customer = generateTestUser('customer');
    const page1 = page;
    await signupViaUI(
      page1,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Create a request
    await page1.click('a:has-text("Нова заявка")');
    await page1.fill('textarea[placeholder*="Описание"]', 'Test job');
    await page1.selectOption('select[name="category"]', 'cat-cleaning');
    await page1.selectOption('select[name="region"]', 'reg-sofia');
    await page1.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page1.fill('input[type="number"]', '50');
    await page1.click('button:has-text("Създай заявка")');
    await page1.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Logout customer
    await page1.click('button[aria-label="User menu"]');
    await page1.click('a:has-text("Изход")');
    await page1.waitForURL('/', { timeout: 10000 });

    // Signup as provider
    const provider = generateTestUser('provider');
    await signupViaUI(
      page1,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Navigate to available jobs
    await page1.click('a:has-text("Налични работи")');

    // Should see the request
    await expect(page1.locator('text=Test job')).toBeVisible();
  });

  test('should accept a request', async ({ page }) => {
    // Create customer and request
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
    await page.fill('textarea[placeholder*="Описание"]', 'Test job');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '50');
    await page.click('button:has-text("Създай заявка")');
    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Get request ID from URL
    const requestUrl = page.url();
    const requestId = requestUrl.split('/').pop();

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Signup as provider
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Navigate to available jobs
    await page.click('a:has-text("Налични работи")');

    // Click on the request
    await page.click(`a:has-text("Test job")`);

    // Click accept button
    await page.click('button:has-text("Приеми работата")');

    // Should show success message
    await expect(page.locator('text=Работата е приета')).toBeVisible({
      timeout: 5000,
    });

    // Should show accepted status
    await expect(page.locator('text=Приета')).toBeVisible();
  });

  test('should show accepted requests in my jobs', async ({ page }) => {
    // Create customer and request
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
    await page.fill('textarea[placeholder*="Описание"]', 'Test job');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '50');
    await page.click('button:has-text("Създай заявка")');
    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Signup as provider
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Navigate to available jobs
    await page.click('a:has-text("Налични работи")');

    // Accept the request
    await page.click(`a:has-text("Test job")`);
    await page.click('button:has-text("Приеми работата")');

    // Navigate to my jobs
    await page.click('a:has-text("Мои работи")');

    // Should see the accepted request
    await expect(page.locator('text=Test job')).toBeVisible();
  });

  test('should not allow accepting already accepted request', async ({
    page,
  }) => {
    // Create customer and request
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
    await page.fill('textarea[placeholder*="Описание"]', 'Test job');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '50');
    await page.click('button:has-text("Създай заявка")');
    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Signup as first provider
    const provider1 = generateTestUser('provider');
    await signupViaUI(
      page,
      provider1.email,
      provider1.password,
      provider1.fullName,
      'provider'
    );

    // Navigate to available jobs
    await page.click('a:has-text("Налични работи")');

    // Accept the request
    await page.click(`a:has-text("Test job")`);
    await page.click('button:has-text("Приеми работата")');

    // Logout first provider
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Signup as second provider
    const provider2 = generateTestUser('provider');
    await signupViaUI(
      page,
      provider2.email,
      provider2.password,
      provider2.fullName,
      'provider'
    );

    // Try to view the request
    // The request should no longer be in available jobs
    await page.click('a:has-text("Налични работи")');

    // Request should not be visible
    await expect(page.locator('text=Test job')).not.toBeVisible();
  });
});
