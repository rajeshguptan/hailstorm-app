// Test data seeding utilities for Playwright tests

export interface TestCollection {
  name: string;
  folders?: TestFolder[];
  requests?: TestRequest[];
}

export interface TestFolder {
  name: string;
  requests?: TestRequest[];
}

export interface TestRequest {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  auth?: {
    type: 'basic' | 'bearer' | 'api-key';
    config: any;
  };
}

export interface TestEnvironment {
  name: string;
  variables: Record<string, string>;
}

export class TestDataSeeder {
  static readonly SAMPLE_COLLECTION: TestCollection = {
    name: 'Test API Collection',
    folders: [
      {
        name: 'Users',
        requests: [
          {
            name: 'Get Users',
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/users',
          },
          {
            name: 'Create User',
            method: 'POST',
            url: 'https://jsonplaceholder.typicode.com/users',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'John Doe',
              email: 'john@example.com',
            }),
          },
        ],
      },
      {
        name: 'Posts',
        requests: [
          {
            name: 'Get Posts',
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/posts',
          },
        ],
      },
    ],
    requests: [
      {
        name: 'Health Check',
        method: 'GET',
        url: 'https://httpbin.org/status/200',
      },
    ],
  };

  static readonly SAMPLE_ENVIRONMENT: TestEnvironment = {
    name: 'Development',
    variables: {
      BASE_URL: 'https://jsonplaceholder.typicode.com',
      API_KEY: 'test-api-key-123',
      AUTH_TOKEN: 'bearer-token-456',
    },
  };

  // Utility methods to generate test data
  static createCollection(name: string, requestCount: number = 3): TestCollection {
    const requests: TestRequest[] = [];
    for (let i = 1; i <= requestCount; i++) {
      requests.push({
        name: `Test Request ${i}`,
        method: 'GET',
        url: `https://httpbin.org/get?test=${i}`,
      });
    }
    return {
      name,
      requests,
    };
  }

  static createEnvironment(name: string, variableCount: number = 5): TestEnvironment {
    const variables: Record<string, string> = {};
    for (let i = 1; i <= variableCount; i++) {
      variables[`VAR_${i}`] = `value_${i}`;
    }
    return {
      name,
      variables,
    };
  }

  // Methods to populate app state via localStorage or UI interactions
  // Note: These would be implemented in test fixtures
  static async populateCollections(page: any, collections: TestCollection[]): Promise<void> {
    // Implementation would interact with UI or set localStorage
    // For now, this is a placeholder
  }

  static async populateEnvironments(page: any, environments: TestEnvironment[]): Promise<void> {
    // Implementation would interact with UI or set localStorage
  }

  static async clearAppData(page: any): Promise<void> {
    // Clear localStorage to reset app state
    await page.evaluate(() => {
      localStorage.clear();
      window.location.reload();
    });
  }
}