import { test, expect } from '@playwright/test';
import { signupViaUI } from '../helpers/auth';
import { generateTestUser } from '../helpers/testData';

test.describe('Full Job Lifecycle', () => {
  test('should complete full job lifecycle: create → accept → start → complete → close', async ({
    page,
  }) => {
    // Step 1: Customer creates request
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Full lifecycle test');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });
    const requestUrl = page.url();
    const requestId = requestUrl.split('/').pop();

    // Verify request is pending
    await expect(page.locator('text=Очаква')).toBeVisible();

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Step 2: Provider accepts request
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    await page.click('a:has-text("Налични работи")');
    await page.click(`a:has-text("Full lifecycle test")`);
    await page.click('button:has-text("Приеми работата")');

    // Verify request is accepted
    await expect(page.locator('text=Приета')).toBeVisible();

    // Step 3: Provider starts request
    await page.click('button:has-text("Начни работата")');

    // Verify request is in progress
    await expect(page.locator('text=В процес')).toBeVisible();

    // Step 4: Provider completes request
    await page.click('button:has-text("Завърши работата")');

    // Verify request is completed
    await expect(page.locator('text=Завършена')).toBeVisible();

    // Step 5: Customer closes request (payment)
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Login as customer
    await page.goto('/login');
    await page.fill('input[type="email"]', customer.email);
    await page.fill('input[type="password"]', customer.password);
    await page.click('button:has-text("Вход")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to request
    await page.goto(`/requests/${requestId}`);

    // Close request (capture payment)
    await page.click('button:has-text("Затвори и плати")');

    // Verify request is closed
    await expect(page.locator('text=Затворена')).toBeVisible();
  });

  test('should track request status changes in timeline', async ({ page }) => {
    // Customer creates request
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Timeline test');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Check timeline shows creation
    await expect(page.locator('text=Заявката е създадена')).toBeVisible();

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Provider accepts
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    await page.click('a:has-text("Налични работи")');
    await page.click(`a:has-text("Timeline test")`);
    await page.click('button:has-text("Приеми работата")');

    // Check timeline shows acceptance
    await expect(page.locator('text=Работата е приета')).toBeVisible();

    // Start request
    await page.click('button:has-text("Начни работата")');

    // Check timeline shows start
    await expect(page.locator('text=Работата е начната')).toBeVisible();

    // Complete request
    await page.click('button:has-text("Завърши работата")');

    // Check timeline shows completion
    await expect(page.locator('text=Работата е завършена')).toBeVisible();
  });

  test('should update request status in real-time', async ({ page }) => {
    // Customer creates request
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Real-time test');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });
    const requestUrl = page.url();
    const requestId = requestUrl.split('/').pop();

    // Verify initial status
    await expect(page.locator('text=Очаква')).toBeVisible();

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Provider accepts
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Navigate to request
    await page.goto(`/requests/${requestId}`);

    // Accept request
    await page.click('button:has-text("Приеми работата")');

    // Status should update to accepted
    await expect(page.locator('text=Приета')).toBeVisible();

    // Start request
    await page.click('button:has-text("Начни работата")');

    // Status should update to in progress
    await expect(page.locator('text=В процес')).toBeVisible();

    // Complete request
    await page.click('button:has-text("Завърши работата")');

    // Status should update to completed
    await expect(page.locator('text=Завършена')).toBeVisible();
  });

  test('should prevent invalid status transitions', async ({ page }) => {
    // Customer creates request
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Invalid transition test');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Try to complete without accepting (should not be possible)
    const completeButton = page.locator('button:has-text("Завърши работата")');
    const isDisabled = await completeButton.isDisabled();

    // Button should be disabled or not visible
    expect(isDisabled || !(await completeButton.isVisible())).toBe(true);
  });
});
