# End-to-End Testing Guide

## Overview

TRASHit uses Playwright for comprehensive end-to-end testing. The test suite covers all critical user journeys and edge cases.

## Test Structure

```
tests/
├── e2e/                           # E2E test files
│   ├── auth.spec.ts              # Authentication tests
│   ├── customer-create-request.spec.ts  # Customer workflows
│   ├── provider-accept-job.spec.ts      # Provider workflows
│   ├── full-job-lifecycle.spec.ts       # Complete job flow
│   ├── race-condition.spec.ts           # Concurrency tests
│   ├── dispute-flow.spec.ts             # Dispute handling
│   ├── admin-approve-provider.spec.ts   # Admin workflows
│   └── region-access-control.spec.ts    # Region filtering
├── helpers/
│   ├── auth.ts                   # Authentication utilities
│   └── testData.ts               # Test data generators
├── global-setup.ts               # Global test setup
└── global-teardown.ts            # Global test teardown
```

## Setup

### Prerequisites

1. Node.js 20+
2. npm or yarn
3. Local dev server running
4. Test database configured

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Configuration

**File:** `playwright.config.ts`

Key settings:
- `testDir: './tests/e2e'` - Test directory
- `baseURL: http://localhost:3000` - Application URL
- `workers: 1` - Sequential execution (prevents race condition issues)
- `timeout: 30000` - Test timeout (30 seconds)
- `retries: 2` - Retry failed tests (CI only)

### Environment Variables

```env
# Test database
DATABASE_URL=postgresql://user:password@localhost:5432/trashit_test

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Playwright
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## Running Tests

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/auth.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "should login"

# Run in UI mode (interactive)
npm run test:e2e -- --ui

# Run with headed browser (see browser)
npm run test:e2e -- --headed

# Run with debug mode
npm run test:e2e -- --debug
```

### CI/CD Pipeline

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Workflow:** `.github/workflows/e2e.yml`

Features:
- Runs on Ubuntu latest
- Parallel test execution (when safe)
- Automatic retry on failure
- Test report generation
- Video artifacts on failure
- PR comment with results

## Test Suites

### 1. Authentication (`auth.spec.ts`)

Tests user authentication flows:
- ✅ Signup as customer
- ✅ Signup as provider
- ✅ Login with valid credentials
- ✅ Reject invalid password
- ✅ Reject non-existent email
- ✅ Logout
- ✅ Prevent duplicate email
- ✅ Persist auth across reload
- ✅ Redirect to login if not authenticated

**Run:**
```bash
npm run test:e2e -- tests/e2e/auth.spec.ts
```

### 2. Customer Workflows (`customer-create-request.spec.ts`)

Tests customer request creation:
- ✅ Create new request
- ✅ Validation errors
- ✅ List requests on dashboard
- ✅ Show pending status
- ✅ Edit pending request
- ✅ Cancel pending request

**Run:**
```bash
npm run test:e2e -- tests/e2e/customer-create-request.spec.ts
```

### 3. Provider Workflows (`provider-accept-job.spec.ts`)

Tests provider job acceptance:
- ✅ View available requests
- ✅ Accept request
- ✅ Show in my jobs
- ✅ Prevent accepting already accepted request

**Run:**
```bash
npm run test:e2e -- tests/e2e/provider-accept-job.spec.ts
```

### 4. Full Job Lifecycle (`full-job-lifecycle.spec.ts`)

Tests complete request lifecycle:
- ✅ Create → Accept → Start → Complete → Close
- ✅ Track status changes in timeline
- ✅ Update status in real-time
- ✅ Prevent invalid transitions

**Run:**
```bash
npm run test:e2e -- tests/e2e/full-job-lifecycle.spec.ts
```

### 5. Race Conditions (`race-condition.spec.ts`)

Tests concurrent access scenarios:
- ✅ Only one provider can accept
- ✅ Show error to second provider
- ✅ Maintain consistency across 10 attempts

**Run:**
```bash
npm run test:e2e -- tests/e2e/race-condition.spec.ts
```

### 6. Dispute Flow (`dispute-flow.spec.ts`)

Tests dispute handling:
- ✅ Open dispute after completion
- ✅ Prevent dispute outside 48-hour window
- ✅ Show dispute in admin panel

**Run:**
```bash
npm run test:e2e -- tests/e2e/dispute-flow.spec.ts
```

### 7. Admin Workflows (`admin-approve-provider.spec.ts`)

Tests admin functions:
- ✅ Approve pending provider
- ✅ Suspend provider
- ✅ Ban provider
- ✅ Show pending count
- ✅ Send approval email

**Run:**
```bash
npm run test:e2e -- tests/e2e/admin-approve-provider.spec.ts
```

### 8. Region Access Control (`region-access-control.spec.ts`)

Tests region filtering:
- ✅ Show only requests in selected regions
- ✅ Filter requests by region
- ✅ Prevent accepting out-of-region request

**Run:**
```bash
npm run test:e2e -- tests/e2e/region-access-control.spec.ts
```

## Test Helpers

### Authentication Helpers (`tests/helpers/auth.ts`)

```typescript
// Login via UI
await loginViaUI(page, email, password);

// Signup via UI
await signupViaUI(page, email, password, fullName, role);

// Logout
await logoutViaUI(page);

// Check if logged in
const loggedIn = await isLoggedIn(page);

// Get auth token
const token = await getAuthToken(page);
```

### Test Data Helpers (`tests/helpers/testData.ts`)

```typescript
// Generate test email
const email = generateTestEmail('customer');

// Generate test user
const user = generateTestUser('provider');

// Generate test request
const request = generateTestRequest();

// Create user via API
const user = await createTestUserViaAPI(baseURL, userData);

// Create request via API
const request = await createTestRequestViaAPI(baseURL, token, requestData);

// Accept request via API
await acceptRequestViaAPI(baseURL, token, requestId);

// Complete request via API
await completeRequestViaAPI(baseURL, token, requestId);
```

## Debugging Tests

### UI Mode

Interactive test runner:
```bash
npm run test:e2e -- --ui
```

Features:
- Step through tests
- Inspect elements
- Replay actions
- View network requests

### Debug Mode

Step-by-step debugging:
```bash
npm run test:e2e -- --debug
```

Features:
- Pause at breakpoints
- Inspect page state
- Execute commands in console

### Headed Mode

See browser while tests run:
```bash
npm run test:e2e -- --headed
```

### Screenshots & Videos

Automatically captured on failure:
- Screenshots: `test-results/`
- Videos: `test-results/videos/`

View in HTML report:
```bash
npx playwright show-report
```

## Best Practices

### Test Isolation

Each test is independent:
- Creates fresh test users
- Uses unique emails (timestamp-based)
- Cleans up after completion
- No shared state between tests

### Test Data

Use helpers for consistency:
```typescript
// ✅ Good
const user = generateTestUser('provider');

// ❌ Bad
const user = { email: 'test@example.com', ... };
```

### Waiting

Always wait for navigation:
```typescript
// ✅ Good
await page.click('button');
await page.waitForURL('/dashboard', { timeout: 10000 });

// ❌ Bad
await page.click('button');
await page.goto('/dashboard');
```

### Assertions

Use specific selectors:
```typescript
// ✅ Good
await expect(page.locator('text=Success')).toBeVisible();

// ❌ Bad
await expect(page.locator('div')).toBeVisible();
```

### Error Handling

Handle async operations:
```typescript
// ✅ Good
await expect(page.locator('text=Error')).toBeVisible({ timeout: 5000 });

// ❌ Bad
expect(await page.locator('text=Error').isVisible()).toBe(true);
```

## CI/CD Integration

### GitHub Actions

Workflow file: `.github/workflows/e2e.yml`

Triggers:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

Features:
- Automatic test execution
- Test report generation
- Video artifacts on failure
- PR comments with results
- Blocks merge on failure

### Local Pre-commit

Run tests before committing:
```bash
# Add to .git/hooks/pre-commit
npm run test:e2e
```

## Troubleshooting

### Tests Timeout

Increase timeout:
```bash
npm run test:e2e -- --timeout=60000
```

### Flaky Tests

- Add explicit waits
- Use `waitForURL` for navigation
- Increase timeout for slow operations
- Check for race conditions

### Browser Issues

Clear browser cache:
```bash
rm -rf ~/.cache/ms-playwright
npx playwright install
```

### Database Issues

Reset test database:
```bash
npm run db:reset:test
npm run db:migrate:test
```

## Performance

### Execution Time

- Total: ~5-10 minutes (all tests)
- Per test: 30-60 seconds
- Parallel: Can run 4-8 tests simultaneously

### Optimization

- Run only affected tests
- Use `--grep` to filter
- Parallel execution (when safe)
- Skip slow tests in development

## Continuous Improvement

### Adding New Tests

1. Create new `.spec.ts` file in `tests/e2e/`
2. Follow naming convention: `feature-name.spec.ts`
3. Use existing helpers
4. Add to documentation
5. Run locally before pushing

### Updating Tests

When UI changes:
1. Update selectors
2. Test locally
3. Run full suite
4. Commit with test changes

### Monitoring

Track test metrics:
- Pass rate
- Execution time
- Flakiness
- Coverage

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Support

For test issues:
1. Check Playwright docs
2. Review test logs
3. Run in debug mode
4. Check CI workflow
5. Create issue with details
