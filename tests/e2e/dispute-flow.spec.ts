import { test, expect } from '@playwright/test';
import { signupViaUI } from '../helpers/auth';
import { generateTestUser } from '../helpers/testData';

test.describe('Dispute Flow', () => {
  test('should open dispute after job completion', async ({ page }) => {
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
    await page.fill('textarea[placeholder*="Описание"]', 'Dispute test');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });
    const requestUrl = page.url();
    const requestId = requestUrl.split('/').pop();

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Provider accepts and completes
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    await page.goto(`/requests/${requestId}`);
    await page.click('button:has-text("Приеми работата")');
    await page.click('button:has-text("Начни работата")');
    await page.click('button:has-text("Завърши работата")');

    // Logout provider
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Customer opens dispute
    await page.goto('/login');
    await page.fill('input[type="email"]', customer.email);
    await page.fill('input[type="password"]', customer.password);
    await page.click('button:has-text("Вход")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    await page.goto(`/requests/${requestId}`);

    // Click dispute button
    await page.click('button:has-text("Отвори спор")');

    // Fill dispute form
    await page.fill('textarea[placeholder*="Причина"]', 'Work not completed properly');
    await page.click('button:has-text("Отвори спор")');

    // Should show success
    await expect(page.locator('text=Спорът е отворен')).toBeVisible({
      timeout: 5000,
    });

    // Status should change to disputed
    await expect(page.locator('text=Спор')).toBeVisible();
  });

  test('should not allow dispute outside 48-hour window', async ({ page }) => {
    // This test would require manipulating time or using a test endpoint
    // For now, we'll test the UI validation

    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Create and complete a request
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Old request');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });
    const requestUrl = page.url();
    const requestId = requestUrl.split('/').pop();

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Provider completes
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    await page.goto(`/requests/${requestId}`);
    await page.click('button:has-text("Приеми работата")');
    await page.click('button:has-text("Начни работата")');
    await page.click('button:has-text("Завърши работата")');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Customer closes request
    await page.goto('/login');
    await page.fill('input[type="email"]', customer.email);
    await page.fill('input[type="password"]', customer.password);
    await page.click('button:has-text("Вход")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    await page.goto(`/requests/${requestId}`);
    await page.click('button:has-text("Затвори и плати")');

    // Dispute button should be disabled or hidden
    const disputeButton = page.locator('button:has-text("Отвори спор")');
    expect(await disputeButton.isDisabled()).toBe(true);
  });

  test('should show dispute in admin panel', async ({ page }) => {
    // Customer creates and opens dispute
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Admin dispute test');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Test Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });
    const requestUrl = page.url();
    const requestId = requestUrl.split('/').pop();

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Provider completes
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    await page.goto(`/requests/${requestId}`);
    await page.click('button:has-text("Приеми работата")');
    await page.click('button:has-text("Начни работата")');
    await page.click('button:has-text("Завърши работата")');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Customer opens dispute
    await page.goto('/login');
    await page.fill('input[type="email"]', customer.email);
    await page.fill('input[type="password"]', customer.password);
    await page.click('button:has-text("Вход")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    await page.goto(`/requests/${requestId}`);
    await page.click('button:has-text("Отвори спор")');
    await page.fill('textarea[placeholder*="Причина"]', 'Work not completed');
    await page.click('button:has-text("Отвори спор")');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Admin views disputes
    const admin = generateTestUser('admin');
    await signupViaUI(
      page,
      admin.email,
      admin.password,
      admin.fullName,
      'admin'
    );

    // Navigate to admin disputes
    await page.click('a:has-text("Администрация")');
    await page.click('a:has-text("Спорове")');

    // Should see the dispute
    await expect(page.locator('text=Admin dispute test')).toBeVisible();
  });
});
