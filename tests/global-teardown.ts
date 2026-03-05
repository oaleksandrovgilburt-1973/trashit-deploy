import { FullConfig } from '@playwright/test';

/**
 * Global Teardown
 * Runs after all tests
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  // Optional: Clean up test data
  if (process.env.CLEANUP_DATA === 'true') {
    console.log('🗑️ Cleaning up test data...');
    try {
      const response = await fetch(
        `${config.use.baseURL}/api/v1/test/cleanup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn('⚠️ Failed to cleanup data');
      } else {
        console.log('✅ Cleanup complete');
      }
    } catch (error) {
      console.warn('⚠️ Could not cleanup data:', error);
    }
  }

  console.log('✅ Global teardown complete');
}

export default globalTeardown;
