import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup
 * Runs before all tests
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  // Optional: Reset test database
  if (process.env.RESET_DB === 'true') {
    console.log('🔄 Resetting test database...');
    try {
      const response = await fetch(
        `${config.use.baseURL}/api/v1/test/reset-db`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn('⚠️ Failed to reset database');
      } else {
        console.log('✅ Database reset complete');
      }
    } catch (error) {
      console.warn('⚠️ Could not reset database:', error);
    }
  }

  // Optional: Seed test data
  if (process.env.SEED_DATA === 'true') {
    console.log('🌱 Seeding test data...');
    try {
      const response = await fetch(
        `${config.use.baseURL}/api/v1/test/seed-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn('⚠️ Failed to seed data');
      } else {
        console.log('✅ Test data seeded');
      }
    } catch (error) {
      console.warn('⚠️ Could not seed data:', error);
    }
  }

  console.log('✅ Global setup complete');
}

export default globalSetup;
