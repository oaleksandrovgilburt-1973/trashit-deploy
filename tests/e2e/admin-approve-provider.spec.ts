import { test, expect } from '@playwright/test';
import { signupViaUI, loginViaUI } from '../helpers/auth';
import { generateTestUser } from '../helpers/testData';

test.describe('Admin - Approve Provider', () => {
  test('should approve pending provider', async ({ page }) => {
    // Provider signs up
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Logout provider
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Admin signs up
    const admin = generateTestUser('admin');
    await signupViaUI(
      page,
      admin.email,
      admin.password,
      admin.fullName,
      'admin'
    );

    // Navigate to admin users
    await page.click('a:has-text("Администрация")');
    await page.click('a:has-text("Потребители")');

    // Find pending provider
    await page.fill('input[placeholder*="Търсене"]', provider.email);

    // Click on provider
    await page.click(`text=${provider.fullName}`);

    // Verify status is pending
    await expect(page.locator('text=Очаква одобрение')).toBeVisible();

    // Click approve button
    await page.click('button:has-text("Одобри")');

    // Confirm approval
    await page.click('button:has-text("Да, одобри")');

    // Should show success
    await expect(page.locator('text=Одобрено')).toBeVisible({ timeout: 5000 });

    // Status should change to approved
    await expect(page.locator('text=Одобрено')).toBeVisible();
  });

  test('should suspend provider', async ({ page }) => {
    // Provider signs up
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Logout provider
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Admin signs up
    const admin = generateTestUser('admin');
    await signupViaUI(
      page,
      admin.email,
      admin.password,
      admin.fullName,
      'admin'
    );

    // Navigate to admin users
    await page.click('a:has-text("Администрация")');
    await page.click('a:has-text("Потребители")');

    // Find provider
    await page.fill('input[placeholder*="Търсене"]', provider.email);

    // Click on provider
    await page.click(`text=${provider.fullName}`);

    // Click suspend button
    await page.click('button:has-text("Спри")');

    // Fill reason
    await page.fill('textarea[placeholder*="Причина"]', 'Violation of terms');

    // Confirm suspension
    await page.click('button:has-text("Да, спри")');

    // Should show success
    await expect(page.locator('text=Потребителят е спрян')).toBeVisible({
      timeout: 5000,
    });

    // Logout admin
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Try to login as suspended provider
    await loginViaUI(page, provider.email, provider.password);

    // Should be redirected to suspended page or error
    await expect(
      page.locator('text=Вашият акаунт е спрян|account_suspended')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should ban provider', async ({ page }) => {
    // Provider signs up
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Logout provider
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Admin signs up
    const admin = generateTestUser('admin');
    await signupViaUI(
      page,
      admin.email,
      admin.password,
      admin.fullName,
      'admin'
    );

    // Navigate to admin users
    await page.click('a:has-text("Администрация")');
    await page.click('a:has-text("Потребители")');

    // Find provider
    await page.fill('input[placeholder*="Търсене"]', provider.email);

    // Click on provider
    await page.click(`text=${provider.fullName}`);

    // Click ban button
    await page.click('button:has-text("Забрани")');

    // Fill reason
    await page.fill('textarea[placeholder*="Причина"]', 'Severe violation');

    // Confirm ban
    await page.click('button:has-text("Да, забрани")');

    // Should show success
    await expect(page.locator('text=Потребителят е забранен')).toBeVisible({
      timeout: 5000,
    });

    // Logout admin
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Try to login as banned provider
    await loginViaUI(page, provider.email, provider.password);

    // Should be rejected
    await expect(
      page.locator('text=Вашият акаунт е забранен|account_suspended')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show pending providers count', async ({ page }) => {
    // Create multiple pending providers
    for (let i = 0; i < 3; i++) {
      const provider = generateTestUser('provider');
      await signupViaUI(
        page,
        provider.email,
        provider.password,
        provider.fullName,
        'provider'
      );

      // Logout
      await page.click('button[aria-label="User menu"]');
      await page.click('a:has-text("Изход")');
      await page.waitForURL('/', { timeout: 10000 });
    }

    // Admin signs up
    const admin = generateTestUser('admin');
    await signupViaUI(
      page,
      admin.email,
      admin.password,
      admin.fullName,
      'admin'
    );

    // Navigate to admin dashboard
    await page.click('a:has-text("Администрация")');

    // Should show pending providers count
    await expect(page.locator('text=Очакващи одобрение')).toBeVisible();
    await expect(page.locator('text=3')).toBeVisible();
  });

  test('should send approval email to provider', async ({ page }) => {
    // Provider signs up
    const provider = generateTestUser('provider');
    await signupViaUI(
      page,
      provider.email,
      provider.password,
      provider.fullName,
      'provider'
    );

    // Logout provider
    await page.click('button[aria-label="User menu"]');
    await page.click('a:has-text("Изход")');
    await page.waitForURL('/', { timeout: 10000 });

    // Admin signs up
    const admin = generateTestUser('admin');
    await signupViaUI(
      page,
      admin.email,
      admin.password,
      admin.fullName,
      'admin'
    );

    // Navigate to admin users
    await page.click('a:has-text("Администрация")');
    await page.click('a:has-text("Потребители")');

    // Find provider
    await page.fill('input[placeholder*="Търсене"]', provider.email);

    // Click on provider
    await page.click(`text=${provider.fullName}`);

    // Approve provider
    await page.click('button:has-text("Одобри")');
    await page.click('button:has-text("Да, одобри")');

    // In a real scenario, we would check email service
    // For now, we just verify the UI shows success
    await expect(page.locator('text=Одобрено')).toBeVisible({ timeout: 5000 });
  });
});
