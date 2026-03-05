import { test, expect } from '@playwright/test';
import { signupViaUI } from '../helpers/auth';
import { generateTestUser } from '../helpers/testData';

test.describe('Region Access Control', () => {
  test('should only show requests in selected regions', async ({ page }) => {
    // Provider signs up and selects region
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Set working regions (Sofia only)
    await page.click('a:has-text("Профил")');
    await page.click('button:has-text("Редактирай")');

    // Select Sofia region
    await page.check('input[value="reg-sofia"]');

    // Uncheck other regions
    await page.uncheck('input[value="reg-plovdiv"]');
    await page.uncheck('input[value="reg-varna"]');

    await page.click('button:has-text("Запази")');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Create customer in Sofia
    const customerSofia = generateTestUser('customer');
    await signupViaUI(
      page,
      customerSofia.email,
      customerSofia.password,
      customerSofia.fullName,
      'customer'
    );

    // Create request in Sofia
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Sofia job');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Sofia Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Create customer in Plovdiv
    const customerPlovdiv = generateTestUser('customer');
    await signupViaUI(
      page,
      customerPlovdiv.email,
      customerPlovdiv.password,
      customerPlovdiv.fullName,
      'customer'
    );

    // Create request in Plovdiv
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Plovdiv job');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-plovdiv');
    await page.fill('input[placeholder*="Адрес"]', '456 Plovdiv Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Login as provider
    await page.goto('/login');
    await page.fill('input[type="email"]', provider.email);
    await page.fill('input[type="password"]', provider.password);
    await page.click('button:has-text("Вход")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to available jobs
    await page.click('a:has-text("Налични работи")');

    // Should see Sofia job
    await expect(page.locator('text=Sofia job')).toBeVisible();

    // Should NOT see Plovdiv job
    await expect(page.locator('text=Plovdiv job')).not.toBeVisible();
  });

  test('should filter requests by region', async ({ page }) => {
    // Customer creates requests in different regions
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    // Create Sofia request
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Sofia request');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-sofia');
    await page.fill('input[placeholder*="Адрес"]', '123 Sofia Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Create Plovdiv request
    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Plovdiv request');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-plovdiv');
    await page.fill('input[placeholder*="Адрес"]', '456 Plovdiv Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });

    // Navigate to requests list
    await page.click('a:has-text("Мои заявки")');

    // Should see both requests
    await expect(page.locator('text=Sofia request')).toBeVisible();
    await expect(page.locator('text=Plovdiv request')).toBeVisible();

    // Filter by Sofia
    await page.selectOption('select[name="region"]', 'reg-sofia');

    // Should only see Sofia request
    await expect(page.locator('text=Sofia request')).toBeVisible();
    await expect(page.locator('text=Plovdiv request')).not.toBeVisible();

    // Filter by Plovdiv
    await page.selectOption('select[name="region"]', 'reg-plovdiv');

    // Should only see Plovdiv request
    await expect(page.locator('text=Sofia request')).not.toBeVisible();
    await expect(page.locator('text=Plovdiv request')).toBeVisible();
  });

  test('should prevent provider from accepting out-of-region request', async ({
    page,
  }) => {
    // Provider selects only Sofia
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Set working regions
    await page.click('a:has-text("Профил")');
    await page.click('button:has-text("Редактирай")');

    // Select only Sofia
    await page.check('input[value="reg-sofia"]');
    await page.uncheck('input[value="reg-plovdiv"]');
    await page.uncheck('input[value="reg-varna"]');

    await page.click('button:has-text("Запази")');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Create Plovdiv request
    const customer = generateTestUser('customer');
    await signupViaUI(
      page,
      customer.email,
      customer.password,
      customer.fullName,
      'customer'
    );

    await page.click('a:has-text("Нова заявка")');
    await page.fill('textarea[placeholder*="Описание"]', 'Plovdiv job');
    await page.selectOption('select[name="category"]', 'cat-cleaning');
    await page.selectOption('select[name="region"]', 'reg-plovdiv');
    await page.fill('input[placeholder*="Адрес"]', '456 Plovdiv Street');
    await page.fill('input[type="number"]', '100');
    await page.click('button:has-text("Създай заявка")');

    await page.waitForURL(/\/requests\/\w+/, { timeout: 10000 });
    const requestUrl = page.url();
    const requestId = requestUrl.split('/').pop();

    // Logout customer
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Provider tries to access Plovdiv request directly
    await page.goto(`/requests/${requestId}`);

    // Should show message that they can't accept
    const acceptButton = page.locator('button:has-text("Приеми работата")');

    // Button should be disabled or show error
    const isDisabled = await acceptButton.isDisabled().catch(() => false);
    const isHidden = !(await acceptButton.isVisible().catch(() => true));

    expect(isDisabled || isHidden).toBe(true);
  });
});
