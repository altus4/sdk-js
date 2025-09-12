/**
 * Mock HTTP server for integration tests
 * This simulates the Altus 4 API endpoints
 */

/* eslint-disable prefer-template, object-shorthand, prettier/prettier */

import { Server } from 'http';
import { URL } from 'url';

export interface MockServerResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

export interface MockEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string | RegExp;
  // Response can be static or a function that receives the request (optional)
  response: MockServerResponse | Function;
  delay?: number;
}

export class MockAltus4Server {
  private server: Server | null = null;
  private endpoints: MockEndpoint[] = [];
  private port: number;
  private baseUrl: string;
  // State storage for dynamic responses
  private state = {
    databases: [] as any[],
    apiKeys: [] as any[],
    currentUser: null as any,
    nextDbId: 1,
    nextKeyId: 1,
  };

  constructor(port: number = 0) {
    this.port = port;
    this.baseUrl = '';
    // Initialize with default data
    this.resetState();
  }

  resetState() {
    this.state.databases = [
      {
        id: 'db-123',
        name: 'Test Database',
        host: 'localhost',
        port: 3306,
        database: 'test_db',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
      },
    ];
    this.state.apiKeys = [
      {
        id: 'key-123',
        name: 'Test API Key',
        key: 'ak_test_123456789',
        environment: 'test',
        permissions: ['search', 'analytics'],
        createdAt: '2023-01-01T00:00:00Z',
        lastUsed: '2023-01-15T12:00:00Z',
      },
    ];
    this.state.currentUser = null;
    this.state.nextDbId = 124;
    this.state.nextKeyId = 124;
  }

  addEndpoint(endpoint: MockEndpoint): void {
    this.endpoints.push(endpoint);
  }

  replaceEndpoint(endpoint: MockEndpoint): void {
    // Remove existing endpoints with same method and path
    this.endpoints = this.endpoints.filter(existing => {
      if (existing.method !== endpoint.method) {
        return true;
      }

      if (typeof existing.path === 'string' && typeof endpoint.path === 'string') {
        return existing.path !== endpoint.path;
      }

      return true; // Keep complex path matching as is for now
    });

    // Add the new endpoint
    this.endpoints.push(endpoint);
  }

  setupDefaultEndpoints(): void {
    // Authentication endpoints
    this.addEndpoint({
      method: 'POST',
      path: '/auth/login',
      response: (_req: any) => {
        const { email, password } = _req.body || {};
        if (email === 'test@altus4.example.com' && password === 'test-password-123') {
          const user = {
            id: 'user-123',
            email: 'test@altus4.example.com',
            name: 'Test User',
            role: 'user',
          };
          // Store the user in state
          this.state.currentUser = user;
          return {
            status: 200,
            data: {
              success: true,
              data: {
                user,
                token: `test-jwt-token-${Date.now()}`,
                expiresIn: 3600,
              },
            },
          };
        } else {
          return {
            status: 401,
            data: {
              success: false,
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
              },
            },
          };
        }
      },
    });

    this.addEndpoint({
      method: 'POST',
      path: '/auth/register',
      response: (_req: any) => {
        const { name, email } = _req.body || {};
        const user = {
          id: 'user-new-123',
          email: email || 'newuser@altus4.example.com',
          name: name || 'New User',
          role: 'user',
        };
        // Store the user in state
        this.state.currentUser = user;
        return {
          status: 201,
          data: {
            success: true,
            data: {
              user: user,
              token: 'test-jwt-token-new-' + Date.now(),
              expiresIn: 3600,
            },
          },
        };
      },
    });

    this.addEndpoint({
      method: 'POST',
      path: '/auth/logout',
      response: {
        status: 200,
        data: { success: true },
      },
    });

    this.addEndpoint({
      method: 'GET',
      path: '/auth/profile',
      response: () => ({
        status: 200,
        data: {
          success: true,
          data: this.state.currentUser || {
            id: 'user-123',
            email: 'test@altus4.example.com',
            name: 'Test User',
            role: 'user',
          },
        },
      }),
    });

    // API Keys endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/keys',
      response: () => ({
        status: 200,
        data: {
          success: true,
          data: [...this.state.apiKeys],
        },
      }),
    });

    this.addEndpoint({
      method: 'POST',
      path: '/keys',
      response: (_req: any) => {
        const newKey = {
          id: `key-${this.state.nextKeyId++}`,
          name: _req.body?.name || 'New Test API Key',
          key: `ak_test_${this.state.nextKeyId}_${Date.now()}`,
          environment: _req.body?.environment || 'test',
          permissions: _req.body?.permissions || ['search'],
          createdAt: new Date().toISOString(),
          lastUsed: null,
        };
        this.state.apiKeys.push(newKey);
        return {
          status: 201,
          data: {
            success: true,
            data: newKey,
          },
        };
      },
    });

    // Update API key endpoint
    this.addEndpoint({
      method: 'PUT',
      path: /^\/keys\/[\w-]+$/,
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            id: 'key-updated-123',
            name: 'Updated API Key Name',
            key: 'ak_test_updated_123456789',
            environment: 'test',
            permissions: ['search'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: new Date().toISOString(),
            lastUsed: null,
          },
        },
      },
    });

    // Revoke API key endpoint
    this.addEndpoint({
      method: 'DELETE',
      path: /^\/keys\/[\w-]+$/,
      response: {
        status: 200,
        data: {
          success: true,
        },
      },
    });

    // Database endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/databases',
      response: () => ({
        status: 200,
        data: {
          success: true,
          data: [...this.state.databases],
        },
      }),
    });

    this.addEndpoint({
      method: 'POST',
      path: '/databases',
      response: (_req: any) => {
        const newDb = {
          id: `db-${this.state.nextDbId++}`,
          name: _req.body?.name || 'New Test Database',
          host: _req.body?.host || 'localhost',
          port: _req.body?.port || 3306,
          database: _req.body?.database || 'new_test_db',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        this.state.databases.push(newDb);
        return {
          status: 201,
          data: {
            success: true,
            data: newDb,
          },
        };
      },
    });

    // Test database connection endpoint
    this.addEndpoint({
      method: 'POST',
      path: /^\/databases\/[\w-]+\/test$/,
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            connected: true,
            responseTime: 45,
            version: 'MySQL 8.0.32',
          },
        },
      },
    });

    // Update database connection endpoint
    this.addEndpoint({
      method: 'PUT',
      path: /^\/databases\/[\w-]+$/,
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            id: 'db-updated-123',
            name: 'Updated Database Name',
            host: 'updated-host.example.com',
            port: 3306,
            database: 'updated_db',
            status: 'active',
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Remove database connection endpoint
    this.addEndpoint({
      method: 'DELETE',
      path: /^\/databases\/[\w-]+$/,
      response: {
        status: 200,
        data: {
          success: true,
        },
      },
    });

    // Analytics endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/analytics/dashboard',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            totalSearches: 1250,
            successfulSearches: 1180,
            avgResponseTime: 85,
            topQueries: [
              { query: 'javascript', count: 45 },
              { query: 'react', count: 38 },
              { query: 'nodejs', count: 32 },
            ],
            searchVolumeOverTime: [
              { date: '2023-01-01', searches: 120 },
              { date: '2023-01-02', searches: 135 },
              { date: '2023-01-03', searches: 128 },
            ],
          },
        },
      },
    });

    // Management endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/health',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            status: 'healthy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            services: {
              database: 'healthy',
              search: 'healthy',
              ai: 'healthy',
            },
          },
        },
      },
    });

    this.addEndpoint({
      method: 'GET',
      path: '/status',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            status: 'healthy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            services: {
              database: 'healthy',
              search: 'healthy',
              ai: 'healthy',
            },
          },
        },
      },
    });

    this.addEndpoint({
      method: 'GET',
      path: '/metrics',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            requests: 1234,
            responseTime: 85,
            uptime: 3600,
          },
        },
      },
    });

    // Analytics trends endpoint
    this.addEndpoint({
      method: 'GET',
      path: '/analytics/trends',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            trends: [
              { period: 'week', searches: 850, change: '+12%' },
              { period: 'month', searches: 3400, change: '+8%' },
            ],
            topGrowingQueries: [
              { query: 'machine learning', growth: '45%' },
              { query: 'api integration', growth: '23%' },
            ],
          },
        },
      },
    });

    // Analytics insights endpoint
    this.addEndpoint({
      method: 'GET',
      path: '/analytics/insights',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            insights: [
              {
                type: 'search',
                title: 'Peak Usage Hours',
                description: 'Most searches occur between 9-11 AM',
                confidence: 0.85,
              },
              {
                type: 'performance',
                title: 'Response Time Improvement',
                description: 'Average response time decreased by 15ms',
                confidence: 0.92,
              },
            ],
          },
        },
      },
    });

    // Analytics performance metrics endpoint
    this.addEndpoint({
      method: 'GET',
      path: '/analytics/performance',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            averageResponseTime: 85,
            p95ResponseTime: 150,
            p99ResponseTime: 250,
            throughput: 120,
            errorRate: 0.02,
            availability: 99.95,
          },
        },
      },
    });

    // Analytics search history endpoint
    this.addEndpoint({
      method: 'GET',
      path: '/analytics/history',
      response: {
        status: 200,
        data: {
          success: true,
          data: [
            {
              id: 'search-1',
              query: 'user authentication',
              timestamp: '2023-01-15T10:30:00Z',
              results: 45,
              responseTime: 82,
            },
            {
              id: 'search-2',
              query: 'database optimization',
              timestamp: '2023-01-15T10:25:00Z',
              results: 23,
              responseTime: 95,
            },
          ],
        },
      },
    });

    // Analytics usage stats endpoint
    this.addEndpoint({
      method: 'GET',
      path: '/analytics/usage',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            totalRequests: 1250,
            uniqueUsers: 85,
            searchesPerUser: 14.7,
            dataTransfer: '2.3 GB',
            peakConcurrency: 23,
            averageSessionDuration: 450,
          },
        },
      },
    });

    // Token refresh endpoint
    this.addEndpoint({
      method: 'POST',
      path: '/auth/refresh',
      response: {
        status: 200,
        data: {
          success: true,
          data: {
            token: 'refreshed-jwt-token-' + Date.now(),
            expiresIn: 3600,
          },
        },
      },
    });
  }

  clearState() {
    this.resetState();
  }

  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.server = new Server((req, res) => {
          this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
          const address = this.server!.address();
          if (address && typeof address === 'object') {
            this.port = address.port;
            this.baseUrl = `http://localhost:${this.port}`;
            resolve(this.baseUrl);
          } else {
            reject(new Error('Failed to get server address'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async handleRequest(req: any, res: any): Promise<void> {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      res.end();
      return;
    }

    let body = '';

    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }

      // Parse URL to get path
      const url = new URL(req.url, `http://localhost:${this.port}`);
      const path = url.pathname;

      const endpoint = this.findMatchingEndpoint(req.method, path);

      if (!endpoint) {
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(
          JSON.stringify({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Endpoint ${req.method} ${path} not found`,
            },
          })
        );
        return;
      }

      const responseData =
        typeof endpoint.response === 'function' ? endpoint.response(req) : endpoint.response;

      const delay = endpoint.delay || 0;

      setTimeout(() => {
        res.writeHead(responseData.status, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          ...responseData.headers,
        });
        res.end(JSON.stringify(responseData.data));
      }, delay);
    });
  }

  private findMatchingEndpoint(method: string, path: string): MockEndpoint | null {
    return (
      this.endpoints.find(endpoint => {
        if (endpoint.method !== method) {
          return false;
        }

        if (typeof endpoint.path === 'string') {
          return path === endpoint.path || path.startsWith(endpoint.path);
        } else {
          return endpoint.path.test(path);
        }
      }) || null
    );
  }
}
