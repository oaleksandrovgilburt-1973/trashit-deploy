/**
 * Test Data Helpers
 * Provides utilities for creating and managing test data
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'customer' | 'provider' | 'admin';
  phone?: string;
}

export interface TestRequest {
  id: string;
  description: string;
  categoryId: string;
  regionId: string;
  address: string;
  amount?: number;
}

/**
 * Generate unique email for test
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.example.com`;
}

/**
 * Generate test user data
 */
export function generateTestUser(
  role: 'customer' | 'provider' | 'admin' = 'customer'
): Omit<TestUser, 'id'> {
  const email = generateTestEmail(role);
  return {
    email,
    password: 'Test@1234567',
    fullName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${Date.now()}`,
    role,
    phone: '+359123456789',
  };
}

/**
 * Generate test request data
 */
export function generateTestRequest(): Omit<TestRequest, 'id'> {
  return {
    description: `Test request ${Date.now()}`,
    categoryId: 'cat-cleaning', // Assuming this category exists
    regionId: 'reg-sofia', // Assuming this region exists
    address: '123 Test Street, Sofia, Bulgaria',
    amount: 50,
  };
}

/**
 * Test credentials for predefined users
 */
export const TEST_USERS = {
  customer: {
    email: process.env.TEST_CUSTOMER_EMAIL || 'customer@test.example.com',
    password: process.env.TEST_CUSTOMER_PASSWORD || 'Test@1234567',
  },
  provider: {
    email: process.env.TEST_PROVIDER_EMAIL || 'provider@test.example.com',
    password: process.env.TEST_PROVIDER_PASSWORD || 'Test@1234567',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Test@1234567',
  },
};

/**
 * Test categories
 */
export const TEST_CATEGORIES = [
  { id: 'cat-cleaning', name: 'Почистване' },
  { id: 'cat-plumbing', name: 'Водопровод' },
  { id: 'cat-electrical', name: 'Електричество' },
  { id: 'cat-carpentry', name: 'Дърводелство' },
];

/**
 * Test regions
 */
export const TEST_REGIONS = [
  { id: 'reg-sofia', name: 'София' },
  { id: 'reg-plovdiv', name: 'Пловдив' },
  { id: 'reg-varna', name: 'Варна' },
];

/**
 * Seed test data via API
 */
export async function seedTestData(baseURL: string) {
  try {
    const response = await fetch(`${baseURL}/api/v1/test/seed-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to seed data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}

/**
 * Reset test database via API
 */
export async function resetTestDatabase(baseURL: string) {
  try {
    const response = await fetch(`${baseURL}/api/v1/test/reset-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to reset database: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Create test user via API
 */
export async function createTestUserViaAPI(
  baseURL: string,
  userData: Omit<TestUser, 'id'>
): Promise<TestUser> {
  try {
    const response = await fetch(`${baseURL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        phone: userData.phone,
        role: userData.role,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.user.id,
      ...userData,
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Create test request via API
 */
export async function createTestRequestViaAPI(
  baseURL: string,
  token: string,
  requestData: Omit<TestRequest, 'id'>
): Promise<TestRequest> {
  try {
    const response = await fetch(`${baseURL}/api/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        description: requestData.description,
        category_id: requestData.categoryId,
        region_id: requestData.regionId,
        address: requestData.address,
        amount: requestData.amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create request: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.request.id,
      ...requestData,
    };
  } catch (error) {
    console.error('Error creating test request:', error);
    throw error;
  }
}

/**
 * Get test request via API
 */
export async function getTestRequestViaAPI(
  baseURL: string,
  token: string,
  requestId: string
): Promise<any> {
  try {
    const response = await fetch(`${baseURL}/api/v1/requests/${requestId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting test request:', error);
    throw error;
  }
}

/**
 * Accept request via API
 */
export async function acceptRequestViaAPI(
  baseURL: string,
  token: string,
  requestId: string
): Promise<any> {
  try {
    const response = await fetch(
      `${baseURL}/api/v1/requests/${requestId}/accept`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to accept request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error accepting request:', error);
    throw error;
  }
}

/**
 * Start request via API
 */
export async function startRequestViaAPI(
  baseURL: string,
  token: string,
  requestId: string
): Promise<any> {
  try {
    const response = await fetch(
      `${baseURL}/api/v1/requests/${requestId}/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting request:', error);
    throw error;
  }
}

/**
 * Complete request via API
 */
export async function completeRequestViaAPI(
  baseURL: string,
  token: string,
  requestId: string
): Promise<any> {
  try {
    const response = await fetch(
      `${baseURL}/api/v1/requests/${requestId}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to complete request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error completing request:', error);
    throw error;
  }
}

/**
 * Close request via API
 */
export async function closeRequestViaAPI(
  baseURL: string,
  token: string,
  requestId: string
): Promise<any> {
  try {
    const response = await fetch(
      `${baseURL}/api/v1/requests/${requestId}/close`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to close request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error closing request:', error);
    throw error;
  }
}
