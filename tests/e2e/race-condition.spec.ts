import { test, expect } from '@playwright/test';
import { signupViaUI } from '../helpers/auth';
import { generateTestUser } from '../helpers/testData';

test.describe('Race Condition - Two Providers, One Request', () => {
  test('should allow only one provider to accept request', async ({
    page,
    context,
  }) => {
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
    await page.fill('textarea[placeholder*="Описание"]', 'Race condition test');
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

    // Create two provider pages
    const provider1 = generateTestUser('provider');
    const provider2 = generateTestUser('provider');

    // Provider 1 signs up
    await signupViaUI(
      page,
      provider1.email,
      provider1.password,
      provider1.fullName,
      'provider'
    );

    // Navigate to request
    await page.goto(`/requests/${requestId}`);

    // Provider 2 signs up in new context
    const page2 = await context.newPage();
    await signupViaUI(
      page2,
      provider2.email,
      provider2.password,
      provider2.fullName,
      'provider'
    );

    // Navigate to same request
    await page2.goto(`/requests/${requestId}`);

    // Both providers try to accept simultaneously
    // Provider 1 accepts
    await page.click('button:has-text("Приеми работата")');

    // Provider 2 tries to accept
    await page2.click('button:has-text("Приеми работата")');

    // Wait for responses
    await page.waitForTimeout(1000);
    await page2.waitForTimeout(1000);

    // One should succeed, one should fail
    const provider1Success = await page
      .locator('text=Работата е приета')
      .isVisible()
      .catch(() => false);
    const provider2Success = await page2
      .locator('text=Работата е приета')
      .isVisible()
      .catch(() => false);

    // Exactly one should succeed
    expect(provider1Success || provider2Success).toBe(true);
    expect(provider1Success && provider2Success).toBe(false);

    // The one who succeeded should see accepted status
    if (provider1Success) {
      await expect(page.locator('text=Приета')).toBeVisible();
    } else {
      await expect(page2.locator('text=Приета')).toBeVisible();
    }

    await page2.close();
  });

  test('should show error to second provider', async ({ page, context }) => {
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
    await page.fill('textarea[placeholder*="Описание"]', 'Race test 2');
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

    // Provider 1 signs up and accepts
    const provider1 = generateTestUser('provider');
    await signupViaUI(
      page,
      provider1.email,
      provider1.password,
      provider1.fullName,
      'provider'
    );

    await page.goto(`/requests/${requestId}`);
    await page.click('button:has-text("Приеми работата")');
    await expect(page.locator('text=Работата е приета')).toBeVisible({
      timeout: 5000,
    });

    // Provider 2 signs up
    const provider2 = generateTestUser('provider');
    const page2 = await context.newPage();
    await signupViaUI(
      page2,
      provider2.email,
      provider2.password,
      provider2.fullName,
      'provider'
    );

    // Navigate to same request
    await page2.goto(`/requests/${requestId}`);

    // Try to accept
    await page2.click('button:has-text("Приеми работата")');

    // Should show error
    await expect(
      page2.locator('text=Работата вече е приета|Не можете да приемете тази работа')
    ).toBeVisible({ timeout: 5000 });

    // Button should be disabled
    const acceptButton = page2.locator('button:has-text("Приеми работата")');
    expect(await acceptButton.isDisabled()).toBe(true);

    await page2.close();
  });

  test('should maintain consistency across 10 concurrent attempts', async ({
    page,
    context,
  }) => {
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
    await page.fill('textarea[placeholder*="Описание"]', 'Stress test');
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

    // Create 10 providers and attempt to accept
    const results: boolean[] = [];
    const pages: any[] = [];

    for (let i = 0; i < 10; i++) {
      const providerPage = await context.newPage();
      pages.push(providerPage);

      const provider = generateTestUser('provider');
      await signupViaUI(
        providerPage,
        provider.email,
        provider.password,
        provider.fullName,
        'provider'
      );

      await providerPage.goto(`/requests/${requestId}`);
    }

    // All try to accept simultaneously
    const acceptPromises = pages.map((p) =>
      p
        .click('button:has-text("Приеми работата")')
        .then(() => true)
        .catch(() => false)
    );

    const acceptResults = await Promise.all(acceptPromises);

    // Count successes
    const successCount = acceptResults.filter((r) => r).length;

    // Exactly one should succeed
    expect(successCount).toBe(1);

    // Close all pages
    for (const p of pages) {
      await p.close();
    }
  });
});
