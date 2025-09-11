# Vue.js Integration Guide for @altus4/sdk

This guide shows how to integrate the Altus 4 SDK into a Vue.js application for local testing and production usage.

## 🔧 **JWT Token Persistence Issue - RESOLVED**

**Issue**: JWT tokens were not persisting across page refreshes or being shared between different SDK instances in Vue.js applications.

**Solution**: Enhanced token management system with:

- ✅ **Centralized Token Storage**: Shared across all SDK instances
- ✅ **Persistent localStorage**: Tokens survive page refreshes
- ✅ **Automatic Token Restoration**: New SDK instances automatically load existing tokens
- ✅ **Reactive Auth State**: Vue components automatically update when auth state changes
- ✅ **Debug Tools**: Built-in debugging for development

## Installation (Local Testing)

Use one of these methods for local development:

### Method 1: npm link (Recommended)

```bash
# In SDK directory
cd /path/to/altus4/sdk
npm run build
npm link

# In your Vue project
npm link @altus4/sdk
```

### Method 2: File Installation

```bash
# In your Vue project
npm install file:../path/to/altus4/sdk
```

### Method 3: Pack Installation

```bash
# In SDK directory
npm pack  # Creates @altus4-sdk-0.0.1.tgz

# In Vue project
npm install ../path/to/altus4/sdk/@altus4-sdk-0.0.1.tgz
```

### 2. Enhanced SDK Plugin (JWT Token Fixed)

**⚠️ IMPORTANT**: This version fixes the JWT token persistence issue.

```typescript
// src/plugins/altus4.ts
import { App, reactive } from 'vue';
import { Altus4SDK, TokenStorageManager } from '@altus4/sdk';
import type { User } from '@altus4/sdk';

export interface Altus4PluginOptions {
  baseURL: string;
  timeout?: number;
  debug?: boolean;
}

// Global reactive auth state - FIXED: Now properly manages token persistence
export const authState = reactive({
  isAuthenticated: false,
  user: null as User | null,
  isLoading: false,
  error: null as string | null,
});

export default {
  install(app: App, options: Altus4PluginOptions) {
    // Create singleton SDK instance - FIXED: Automatic token restoration
    const altus4 = new Altus4SDK({
      baseURL: options.baseURL,
      timeout: options.timeout || 30000,
    });

    // Debug helper for development
    if (options.debug && import.meta.env.DEV) {
      (window as any).__altus4_debug__ = {
        sdk: altus4,
        authState,
        TokenStorageManager,
        debugToken: () => altus4.auth.debugTokenState(),
        getAuthStatus: () => altus4.auth.getAuthStatus(),
      };
      console.log('🔧 Altus4 Debug tools available at window.__altus4_debug__');
    }

    // FIXED: Proper initialization that restores tokens
    const initializeAuth = async () => {
      authState.isLoading = true;
      try {
        // This restores token from storage and fetches user if valid token exists
        const initialized = await altus4.auth.initializeAuthState();
        if (initialized) {
          authState.isAuthenticated = true;
          const userResponse = await altus4.getCurrentUser();
          if (userResponse.success) {
            authState.user = userResponse.user || null;
          }
        }
      } catch (error) {
        console.warn('Failed to initialize auth state:', error);
        authState.error = 'Failed to initialize authentication';
      } finally {
        authState.isLoading = false;
      }
    };

    // Auto-initialize (but don't block app mounting)
    initializeAuth();

    // Enhanced auth helpers - FIXED: Better error handling
    const authHelpers = {
      async login(email: string, password: string) {
        authState.isLoading = true;
        authState.error = null;

        try {
          const result = await altus4.login(email, password);

          if (result.success) {
            authState.isAuthenticated = true;
            authState.user = result.user || null;
            return { success: true, user: result.user };
          } else {
            authState.error = result.error?.message || 'Login failed';
            return { success: false, error: authState.error };
          }
        } catch (error: any) {
          authState.error = error.message || 'Network error';
          return { success: false, error: authState.error };
        } finally {
          authState.isLoading = false;
        }
      },

      async logout() {
        authState.isLoading = true;
        try {
          await altus4.logout();
          authState.isAuthenticated = false;
          authState.user = null;
          authState.error = null;
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          authState.isLoading = false;
        }
      },

      async refreshAuth() {
        const refreshed = await altus4.auth.refreshTokenIfNeeded();
        if (refreshed) {
          const userResponse = await altus4.getCurrentUser();
          if (userResponse.success) {
            authState.user = userResponse.user || null;
          }
        }
        return refreshed;
      },

      // Force re-initialization (useful after errors)
      async reinitialize() {
        return initializeAuth();
      },
    };

    // Make SDK and auth helpers available globally
    app.config.globalProperties.$altus4 = altus4;
    app.config.globalProperties.$auth = authHelpers;

    // Provide for composition API
    app.provide('altus4', altus4);
    app.provide('authHelpers', authHelpers);
    app.provide('authState', authState);
  },
};
```

### 3. Enhanced App Initialization

```typescript
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import altus4Plugin from './plugins/altus4';

const app = createApp(App);

app.use(createPinia());

// Install Altus4 plugin with debug mode for development
app.use(altus4Plugin, {
  baseURL: import.meta.env.VITE_ALTUS4_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  debug: import.meta.env.DEV, // Enable debug mode in development
});

app.use(router);

// Mount the app - auth initialization happens in background
app.mount('#app');
```

### 4. Environment Configuration

```bash
# .env.local (for development)
VITE_ALTUS4_API_URL=http://localhost:3000/api/v1
VITE_APP_DEBUG=true

# .env.production
VITE_ALTUS4_API_URL=https://api.your-domain.com/api/v1
VITE_APP_DEBUG=false
```

## Authentication Integration

### 1. JWT Token Storage Strategy

The Altus4 SDK uses a hybrid approach for secure token management:

**Access Token (JWT):**

- Stored in memory only (cleared on page refresh/close)
- Short-lived (typically 15 minutes to 1 hour)
- Used for API requests via Authorization header
- Automatically attached to requests by the SDK

**Refresh Token:**

- Stored as HttpOnly, Secure cookie (managed by server)
- Long-lived (typically 7-30 days)
- Cannot be accessed by JavaScript (XSS protection)
- Used automatically by SDK for token refresh

**Token Storage Comparison:**

| Method          | Security | Persistence | XSS Risk | CSRF Risk |
| --------------- | -------- | ----------- | -------- | --------- |
| localStorage    | Low      | High        | High     | Low       |
| sessionStorage  | Medium   | Medium      | High     | Low       |
| Memory only     | High     | None        | None     | Low       |
| HttpOnly Cookie | High     | High        | None     | Medium\*  |

\*CSRF risk mitigated by SameSite cookie attribute and CSRF tokens when needed.

**Why This Approach:**

```typescript
// ❌ Vulnerable approach - don't do this
localStorage.setItem('jwt_token', token); // Accessible via XSS

// ✅ Secure approach - SDK handles this
// Access token in memory, refresh token in HttpOnly cookie
const authService = new AuthService(config);
// Token automatically managed and attached to requests
```

### 2. Create Authentication Store (Pinia)

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { altus4 } from '@/services/altus4';

export const useAuthStore = defineStore('auth', () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const user = ref<any>(null);
  const tokenExpiry = ref<number | null>(null);

  const isAuthenticated = computed(() => {
    return altus4.auth.isAuthenticated();
  });

  // Check if token is close to expiring (within 5 minutes)
  const isTokenExpiringSoon = computed(() => {
    if (!tokenExpiry.value) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return tokenExpiry.value - Date.now() < fiveMinutes;
  });

  const currentUser = computed(() => {
    return user.value || altus4.auth.getCurrentUser();
  });

  // Enhanced login with token expiry tracking
  const login = async (credentials: { email: string; password: string }) => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await altus4.auth.handleLogin(credentials);

      if (result.success) {
        user.value = result.user;
        // Track token expiry for proactive refresh
        if (result.expiresIn) {
          tokenExpiry.value = Date.now() + result.expiresIn * 1000;
        }
        return { success: true, user: result.user };
      } else {
        error.value = result.error?.message || 'Login failed';
        return { success: false, error: error.value };
      }
    } catch (err: any) {
      error.value = err.message || 'Login failed';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Register action
  const register = async (userData: { email: string; password: string; name?: string }) => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await altus4.auth.handleRegister(userData);

      if (result.success) {
        user.value = result.user;
        if (result.expiresIn) {
          tokenExpiry.value = Date.now() + result.expiresIn * 1000;
        }
        return { success: true, user: result.user };
      } else {
        error.value = result.error?.message || 'Registration failed';
        return { success: false, error: error.value };
      }
    } catch (err: any) {
      error.value = err.message || 'Registration failed';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Logout action
  const logout = async () => {
    isLoading.value = true;

    try {
      await altus4.auth.handleLogout();
      // Clear local state
      user.value = null;
      tokenExpiry.value = null;
      error.value = null;
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Restore session on app startup
  const restoreSession = async () => {
    isLoading.value = true;

    try {
      // Attempts to refresh using HttpOnly cookie
      const restored = await altus4.auth.restoreSession();
      if (restored) {
        // Get current user info after successful restore
        user.value = altus4.auth.getCurrentUser();
        console.log('Session restored successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Session restore failed:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Proactive token refresh when close to expiring
  const refreshTokenIfNeeded = async () => {
    if (isTokenExpiringSoon.value) {
      try {
        await altus4.auth.refreshToken();
        // Update expiry time after refresh
        const currentUser = altus4.auth.getCurrentUser();
        if (currentUser) {
          user.value = currentUser;
        }
      } catch (err) {
        console.error('Token refresh failed:', err);
        // Token refresh failed, user needs to login again
        await logout();
      }
    }
  };

  // Wrapper for making authenticated API calls
  const makeAuthenticatedRequest = async <T>(requestFn: () => Promise<T>): Promise<T> => {
    // Ensure we have a valid token before making the request
    if (!isAuthenticated.value) {
      throw new Error('User not authenticated');
    }

    // Try to refresh token if needed
    await refreshTokenIfNeeded();

    try {
      return await requestFn();
    } catch (error: any) {
      // If request failed with 401, try to restore session once
      if (error.response?.status === 401) {
        const restored = await restoreSession();
        if (restored) {
          // Retry the request after successful token restore
          return await requestFn();
        } else {
          // Session restore failed, redirect to login
          throw new Error('Authentication expired. Please login again.');
        }
      }
      throw error;
    }
  };

  return {
    isLoading,
    error,
    user,
    isAuthenticated,
    isTokenExpiringSoon,
    currentUser,
    login,
    register,
    logout,
    restoreSession,
    refreshTokenIfNeeded,
    makeAuthenticatedRequest,
  };
});
```

### 2. App Initialization

```typescript
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize auth store and restore session
const initApp = async () => {
  const authStore = useAuthStore();

  // Try to restore session from HttpOnly refresh cookie
  await authStore.restoreSession();

  app.mount('#app');
};

initApp();
```

## Router Integration & Guards

### 1. Router Setup with Auth Guards

```typescript
// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }, // Redirect if already logged in
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Enhanced auth guard with JWT token validation - FIXED
import { TokenStorageManager } from '@altus4/sdk';
import { authState } from '@/plugins/altus4';

router.beforeEach(async (to, from, next) => {
  // Wait for auth initialization if still loading
  if (authState.isLoading) {
    // Wait up to 3 seconds for auth to initialize
    let attempts = 0;
    while (authState.isLoading && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  const requiresAuth = to.meta.requiresAuth;
  const requiresGuest = to.meta.requiresGuest;
  const hasValidToken = TokenStorageManager.hasValidToken();

  // Debug info in development
  if (import.meta.env.DEV) {
    console.log('🧭 Route Guard Debug:', {
      to: to.name,
      requiresAuth,
      requiresGuest,
      hasValidToken,
      authStateAuth: authState.isAuthenticated,
      authStateLoading: authState.isLoading,
    });
  }

  if (requiresAuth) {
    if (!hasValidToken || !authState.isAuthenticated) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath },
      });
      return;
    }
  }

  if (requiresGuest && hasValidToken && authState.isAuthenticated) {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

export default router;
```

## 🔧 **JWT Token Persistence - Testing & Usage**

### Testing Token Persistence

After implementing the fixes, test that JWT tokens now persist correctly:

1. **Login** to your Vue.js app
2. **Refresh the page** - you should stay logged in ✅
3. **Open a new tab** - authentication should be maintained ✅
4. **Close and reopen browser** - session should persist ✅

### Debug Tools (Development Mode)

When running in development, access these debug tools in your browser console:

```javascript
// Check token status
window.__altus4_debug__.getAuthStatus();

// Debug token details
window.__altus4_debug__.debugToken();

// Manual token debugging
window.__altus4_debug__.TokenStorageManager.debugTokenState();
```

## Fixed Vue Components

### 1. Enhanced Authentication Composable

```typescript
// src/composables/useAuth.ts
import { inject, computed } from 'vue';
import type { Altus4SDK } from '@altus4/sdk';
import { TokenStorageManager } from '@altus4/sdk';

export function useAuth() {
  const altus4 = inject<Altus4SDK>('altus4');
  const authHelpers = inject<any>('authHelpers');
  const authState = inject<any>('authState');

  if (!altus4 || !authHelpers || !authState) {
    throw new Error('Altus4 plugin not properly installed');
  }

  const isAuthenticated = computed(() => authState.isAuthenticated);
  const user = computed(() => authState.user);
  const isLoading = computed(() => authState.isLoading);
  const error = computed(() => authState.error);

  return {
    // Reactive State - FIXED: Properly synchronized across app
    isAuthenticated,
    user,
    isLoading,
    error,

    // Actions - FIXED: Better error handling and state management
    login: authHelpers.login,
    logout: authHelpers.logout,
    refreshAuth: authHelpers.refreshAuth,
    reinitialize: authHelpers.reinitialize,

    // SDK access
    sdk: altus4,

    // Token utilities - FIXED: Direct access to token management
    hasValidToken: () => TokenStorageManager.hasValidToken(),
    isTokenExpiring: () => TokenStorageManager.isTokenExpiringSoon(),

    // Debug helpers (development only)
    debugAuth: () => {
      if (import.meta.env.DEV) {
        console.log('🔍 Auth Debug State:');
        console.log('- Authenticated:', isAuthenticated.value);
        console.log('- Has Valid Token:', TokenStorageManager.hasValidToken());
        altus4.auth.debugTokenState();
      }
    },
  };
}
```

### 2. Fixed Login Component

```vue
<!-- src/components/LoginForm.vue -->
<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin" class="login-form">
      <h2>Login to Altus4</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Development Debug Panel -->
      <div v-if="import.meta.env.DEV" class="debug-panel">
        <details>
          <summary>🔧 Debug Info</summary>
          <div class="debug-content">
            <p>Authenticated: {{ isAuthenticated ? '✅' : '❌' }}</p>
            <p>Has Token: {{ hasValidToken() ? '✅' : '❌' }}</p>
            <p>Loading: {{ isLoading ? '⏳' : '✅' }}</p>
            <button type="button" @click="debugAuth">Log Debug Info</button>
          </div>
        </details>
      </div>

      <div class="form-group">
        <label for="email">Email:</label>
        <input
          id="email"
          v-model="credentials.email"
          type="email"
          required
          :disabled="isLoading"
          autocomplete="email"
        />
      </div>

      <div class="form-group">
        <label for="password">Password:</label>
        <input
          id="password"
          v-model="credentials.password"
          type="password"
          required
          :disabled="isLoading"
          autocomplete="current-password"
        />
      </div>

      <button
        type="submit"
        :disabled="isLoading || !credentials.email || !credentials.password"
        class="login-button"
      >
        <span v-if="isLoading">Logging in...</span>
        <span v-else>Login</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const route = useRoute();
const { login, isAuthenticated, isLoading, error, hasValidToken, debugAuth } = useAuth();

const credentials = reactive({
  email: '',
  password: '',
});

const handleLogin = async () => {
  const result = await login(credentials.email, credentials.password);

  if (result.success) {
    // Clear form
    credentials.email = '';
    credentials.password = '';

    // Redirect to intended page or dashboard
    const redirectPath = (route.query.redirect as string) || '/dashboard';
    router.push(redirectPath);
  }
  // Error is automatically handled by the reactive auth state
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.register-link {
  display: block;
  text-align: center;
  margin-top: 1rem;
  color: #007bff;
  text-decoration: none;
}
</style>
```

### 2. Navigation Component with Auth State

```vue
<!-- src/components/AppNavigation.vue -->
<template>
  <nav class="navbar">
    <div class="nav-brand">
      <router-link to="/">Altus4 App</router-link>
    </div>

    <div class="nav-links">
      <template v-if="authStore.isAuthenticated">
        <router-link to="/dashboard">Dashboard</router-link>
        <router-link to="/profile">Profile</router-link>

        <div class="user-menu">
          <span class="user-name">{{ authStore.currentUser?.name || 'User' }}</span>
          <button @click="handleLogout" class="logout-button">Logout</button>
        </div>
      </template>

      <template v-else>
        <router-link to="/login">Login</router-link>
        <router-link to="/register">Register</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/');
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logout-button {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

### 3. Making Consecutive API Requests

When making multiple API requests, the SDK handles JWT token management automatically, but here are best practices:

```vue
<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <div class="welcome-message">Welcome back, {{ authStore.currentUser?.name || 'User' }}!</div>

    <div class="dashboard-content">
      <!-- Example: Multiple API calls with proper error handling -->
      <div class="card">
        <h3>Analytics Dashboard</h3>
        <button @click="loadAllData" :disabled="loading">Load All Data</button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="analytics" class="analytics-data">
          <h4>Search Metrics</h4>
          <pre>{{ JSON.stringify(analytics, null, 2) }}</pre>
        </div>

        <div v-if="userStats" class="user-stats">
          <h4>User Statistics</h4>
          <pre>{{ JSON.stringify(userStats, null, 2) }}</pre>
        </div>

        <div v-if="recentSearches" class="recent-searches">
          <h4>Recent Searches</h4>
          <ul>
            <li v-for="search in recentSearches" :key="search.id">
              {{ search.query }} - {{ search.timestamp }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { AnalyticsService, DatabaseService } from '@altus4/sdk';

const authStore = useAuthStore();
const loading = ref(false);
const error = ref<string | null>(null);
const analytics = ref(null);
const userStats = ref(null);
const recentSearches = ref(null);

// Initialize SDK services
const analyticsService = new AnalyticsService({
  baseURL: process.env.VUE_APP_ALTUS4_API_URL,
});

const databaseService = new DatabaseService({
  baseURL: process.env.VUE_APP_ALTUS4_API_URL,
});

// Method 1: Sequential API calls with auth wrapper
const loadAllDataSequentially = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Each request is wrapped for automatic token refresh
    const analyticsResult = await authStore.makeAuthenticatedRequest(() =>
      analyticsService.getSearchMetrics({ dateRange: '7d' })
    );

    if (analyticsResult.success) {
      analytics.value = analyticsResult.data;
    }

    const statsResult = await authStore.makeAuthenticatedRequest(() =>
      analyticsService.getUserStatistics()
    );

    if (statsResult.success) {
      userStats.value = statsResult.data;
    }

    const searchesResult = await authStore.makeAuthenticatedRequest(() =>
      databaseService.getRecentSearches({ limit: 10 })
    );

    if (searchesResult.success) {
      recentSearches.value = searchesResult.data;
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load data';

    // If authentication error, redirect to login
    if (err.message?.includes('Authentication expired')) {
      await authStore.logout();
      // Router will handle redirect to login
    }
  } finally {
    loading.value = false;
  }
};

// Method 2: Parallel API calls with proper error handling
const loadAllDataInParallel = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Make multiple requests in parallel
    const [analyticsResult, statsResult, searchesResult] = await Promise.allSettled([
      authStore.makeAuthenticatedRequest(() =>
        analyticsService.getSearchMetrics({ dateRange: '7d' })
      ),
      authStore.makeAuthenticatedRequest(() => analyticsService.getUserStatistics()),
      authStore.makeAuthenticatedRequest(() => databaseService.getRecentSearches({ limit: 10 })),
    ]);

    // Handle each result
    if (analyticsResult.status === 'fulfilled' && analyticsResult.value.success) {
      analytics.value = analyticsResult.value.data;
    }

    if (statsResult.status === 'fulfilled' && statsResult.value.success) {
      userStats.value = statsResult.value.data;
    }

    if (searchesResult.status === 'fulfilled' && searchesResult.value.success) {
      recentSearches.value = searchesResult.value.data;
    }

    // Check if any requests failed
    const failures = [analyticsResult, statsResult, searchesResult].filter(
      result => result.status === 'rejected'
    );

    if (failures.length > 0) {
      console.warn(`${failures.length} requests failed`);
      // Handle partial failures gracefully
      error.value = `Some data could not be loaded (${failures.length} requests failed)`;
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
};

// Method 3: Direct SDK calls (automatic token refresh built-in)
const loadDataWithDirectSDKCalls = async () => {
  loading.value = true;
  error.value = null;

  try {
    // SDK handles token refresh automatically via interceptors
    const [analyticsResult, statsResult, searchesResult] = await Promise.all([
      analyticsService.getSearchMetrics({ dateRange: '7d' }),
      analyticsService.getUserStatistics(),
      databaseService.getRecentSearches({ limit: 10 }),
    ]);

    if (analyticsResult.success) analytics.value = analyticsResult.data;
    if (statsResult.success) userStats.value = statsResult.data;
    if (searchesResult.success) recentSearches.value = searchesResult.data;
  } catch (err: any) {
    error.value = err.message || 'Failed to load data';

    // SDK will automatically handle 401 errors and retry
    // If all retries fail, user needs to login again
    if (err.response?.status === 401) {
      await authStore.logout();
    }
  } finally {
    loading.value = false;
  }
};

// Choose your preferred method
const loadAllData = loadDataWithDirectSDKCalls;

// Auto-load data when component mounts
onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.analytics-data,
.user-stats {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.recent-searches ul {
  list-style: none;
  padding: 0;
}

.recent-searches li {
  background: #f8f9fa;
  padding: 0.5rem;
  margin: 0.25rem 0;
  border-radius: 4px;
}
</style>
```

### 4. Advanced JWT Token Management

```typescript
// src/composables/useApiRequest.ts
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

export function useApiRequest() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Generic function for making authenticated API requests
   * Handles token refresh, retry logic, and error states
   */
  const executeRequest = async <T>(
    requestFn: () => Promise<T>,
    options: {
      showLoading?: boolean;
      maxRetries?: number;
      retryDelay?: number;
    } = {}
  ): Promise<T | null> => {
    const { showLoading = true, maxRetries = 1, retryDelay = 1000 } = options;

    if (showLoading) loading.value = true;
    error.value = null;

    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Ensure token is fresh before request
        await authStore.refreshTokenIfNeeded();

        const result = await requestFn();
        return result;
      } catch (err: any) {
        attempt++;

        // If 401 error, try to restore session
        if (err.response?.status === 401) {
          const restored = await authStore.restoreSession();

          if (restored && attempt <= maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          } else {
            // Session restore failed, logout user
            await authStore.logout();
            error.value = 'Session expired. Please login again.';
            return null;
          }
        }

        // For other errors, retry if attempts remaining
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // All retries exhausted
        error.value = err.message || 'Request failed';
        console.error('API request failed:', err);
        return null;
      } finally {
        if (showLoading && attempt > maxRetries) {
          loading.value = false;
        }
      }
    }

    if (showLoading) loading.value = false;
    return null;
  };

  /**
   * Execute multiple requests with proper error handling
   */
  const executeMultipleRequests = async <T extends Record<string, any>>(
    requests: Record<keyof T, () => Promise<any>>,
    options: {
      parallel?: boolean;
      failFast?: boolean;
    } = {}
  ): Promise<Partial<T>> => {
    const { parallel = false, failFast = false } = options;
    const results: Partial<T> = {};

    loading.value = true;
    error.value = null;

    try {
      if (parallel) {
        // Execute all requests in parallel
        const entries = Object.entries(requests);
        const promises = entries.map(([key, requestFn]) =>
          executeRequest(requestFn as () => Promise<any>, { showLoading: false }).then(result => ({
            key,
            result,
          }))
        );

        const resolvedResults = await Promise.all(promises);

        resolvedResults.forEach(({ key, result }) => {
          if (result !== null) {
            results[key as keyof T] = result;
          }
        });
      } else {
        // Execute requests sequentially
        for (const [key, requestFn] of Object.entries(requests)) {
          try {
            const result = await executeRequest(requestFn as () => Promise<any>, {
              showLoading: false,
            });
            if (result !== null) {
              results[key as keyof T] = result;
            }
          } catch (err) {
            if (failFast) {
              throw err;
            }
            console.warn(`Request ${key} failed:`, err);
          }
        }
      }
    } finally {
      loading.value = false;
    }

    return results;
  };

  return {
    loading,
    error,
    executeRequest,
    executeMultipleRequests,
  };
}
```

**Usage Example:**

```vue
<script setup lang="ts">
import { useApiRequest } from '@/composables/useApiRequest';
import { AnalyticsService } from '@altus4/sdk';

const { loading, error, executeRequest, executeMultipleRequests } = useApiRequest();
const analyticsService = new AnalyticsService();

// Single request with retry
const loadAnalytics = async () => {
  const result = await executeRequest(
    () => analyticsService.getSearchMetrics({ dateRange: '7d' }),
    { maxRetries: 2, retryDelay: 1500 }
  );

  if (result?.success) {
    analytics.value = result.data;
  }
};

// Multiple requests
const loadDashboardData = async () => {
  const results = await executeMultipleRequests(
    {
      analytics: () => analyticsService.getSearchMetrics({ dateRange: '7d' }),
      stats: () => analyticsService.getUserStatistics(),
      recent: () => databaseService.getRecentSearches({ limit: 10 }),
    },
    { parallel: true }
  );

  if (results.analytics?.success) analytics.value = results.analytics.data;
  if (results.stats?.success) userStats.value = results.stats.data;
  if (results.recent?.success) recentSearches.value = results.recent.data;
};
</script>
```

### 5. JWT Token Debugging & Inspection

For development and debugging purposes, here are utilities to inspect JWT tokens:

```typescript
// src/utils/jwtUtils.ts

/**
 * Decode JWT token payload (for debugging only)
 * Note: This doesn't verify the signature
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Get time until token expires
 */
export function getTokenTimeToExpiry(token: string): number {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
}

/**
 * Development helper to log token information
 */
export function debugToken(token: string): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const decoded = decodeJWT(token);
  if (decoded) {
    console.group('🔍 JWT Token Debug Info');
    console.log('User ID:', decoded.sub || decoded.userId);
    console.log('Email:', decoded.email);
    console.log('Roles:', decoded.roles);
    console.log('Issued At:', new Date(decoded.iat * 1000).toLocaleString());
    console.log('Expires At:', new Date(decoded.exp * 1000).toLocaleString());
    console.log('Time to Expiry:', `${getTokenTimeToExpiry(token)}s`);
    console.log('Is Expired:', isTokenExpired(token));
    console.groupEnd();
  }
}
```

**Enhanced Auth Store with Debugging:**

```typescript
// Add to your auth store
import { decodeJWT, isTokenExpired, debugToken } from '@/utils/jwtUtils';

export const useAuthStore = defineStore('auth', () => {
  // ... existing code ...

  // Debug helper (development only)
  const debugCurrentToken = () => {
    if (process.env.NODE_ENV === 'development') {
      const token = altus4.auth.getToken();
      if (token) {
        debugToken(token);
      } else {
        console.log('No token available');
      }
    }
  };

  // Enhanced token validation
  const validateCurrentToken = (): boolean => {
    const token = altus4.auth.getToken();
    if (!token) return false;

    // Check if token is structurally valid and not expired
    return !isTokenExpired(token);
  };

  // Get token payload for UI display
  const getTokenInfo = () => {
    const token = altus4.auth.getToken();
    if (!token) return null;

    const decoded = decodeJWT(token);
    return {
      userId: decoded?.sub || decoded?.userId,
      email: decoded?.email,
      roles: decoded?.roles || [],
      expiresAt: decoded?.exp ? new Date(decoded.exp * 1000) : null,
      issuedAt: decoded?.iat ? new Date(decoded.iat * 1000) : null,
    };
  };

  return {
    // ... existing returns ...
    debugCurrentToken,
    validateCurrentToken,
    getTokenInfo,
  };
});
```

**Development Debug Component:**

```vue
<!-- src/components/DebugPanel.vue (development only) -->
<template>
  <div v-if="isDevelopment" class="debug-panel">
    <details>
      <summary>🔧 Auth Debug Panel</summary>

      <div class="debug-content">
        <div class="debug-section">
          <h4>Authentication Status</h4>
          <p>Authenticated: {{ authStore.isAuthenticated ? '✅' : '❌' }}</p>
          <p>Token Expiring Soon: {{ authStore.isTokenExpiringSoon ? '⚠️' : '✅' }}</p>
        </div>

        <div class="debug-section" v-if="tokenInfo">
          <h4>Token Information</h4>
          <p>User ID: {{ tokenInfo.userId }}</p>
          <p>Email: {{ tokenInfo.email }}</p>
          <p>Roles: {{ tokenInfo.roles.join(', ') }}</p>
          <p>Expires: {{ tokenInfo.expiresAt?.toLocaleString() }}</p>
          <p>Issued: {{ tokenInfo.issuedAt?.toLocaleString() }}</p>
        </div>

        <div class="debug-actions">
          <button @click="authStore.debugCurrentToken()">Log Token Details</button>
          <button @click="authStore.refreshTokenIfNeeded()">Refresh Token</button>
          <button @click="testApiCall()">Test API Call</button>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { AnalyticsService } from '@altus4/sdk';

const authStore = useAuthStore();

const isDevelopment = process.env.NODE_ENV === 'development';

const tokenInfo = computed(() => {
  return authStore.getTokenInfo?.();
});

const testApiCall = async () => {
  const analyticsService = new AnalyticsService();

  try {
    const result = await analyticsService.getSearchMetrics({ dateRange: '1d' });
    console.log('✅ Test API call successful:', result);
  } catch (error) {
    console.error('❌ Test API call failed:', error);
  }
};
</script>

<style scoped>
.debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  font-size: 0.875rem;
  z-index: 9999;
}

.debug-content {
  margin-top: 0.5rem;
}

.debug-section {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.debug-section:last-of-type {
  border-bottom: none;
}

.debug-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.debug-actions button {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

Add the debug panel to your main layout:

```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <AppNavigation />
    <router-view />
    <DebugPanel />
  </div>
</template>
```

Your backend must support the cookie-based authentication flow:

### 1. Login/Register Endpoints

```typescript
// Backend example (Express.js)
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate credentials
  const user = await validateUser(email, password);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' },
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set HttpOnly refresh cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    token: accessToken,
    expiresIn: 3600, // 1 hour
    user: sanitizeUser(user),
  });
});
```

### 2. Refresh Endpoint

```typescript
app.post('/api/v1/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: { message: 'No refresh token' },
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      token: accessToken,
      expiresIn: 3600,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid refresh token' },
    });
  }
});
```

### 3. Logout Endpoint

```typescript
app.post('/api/v1/auth/logout', (req, res) => {
  // Clear the refresh token cookie
  res.clearCookie('refresh_token');

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
```

## Key Features

### Automatic Token Refresh

- The SDK automatically refreshes expired access tokens using the HttpOnly refresh cookie
- Failed requests due to expired tokens are automatically retried after refresh
- No manual token management required in your Vue components

### Route Protection

- Use Vue Router guards to protect authenticated routes
- Automatic redirects based on authentication state
- Remember intended destination for post-login redirects

### Reactive Authentication State

- Pinia store provides reactive authentication state
- Components automatically update when auth state changes
- Clean separation between UI and authentication logic

### Security Benefits

- Access tokens stored in memory only (cleared on page refresh)
- Refresh tokens stored in secure HttpOnly cookies
- Protection against XSS attacks on token theft
- Automatic cleanup on logout

This integration provides a robust, secure authentication system for your Vue.js application using the Altus4 SDK's cookie-based authentication flow.

## Complete API Reference

### SDK Services Overview

The Altus4 SDK provides five main services:

```typescript
import {
  AuthService, // User authentication and profile management
  AnalyticsService, // Search analytics and insights
  ApiKeysService, // API key management
  DatabaseService, // Database connection management
  ManagementService, // System health and management
} from '@altus4/sdk';
```

### 1. AuthService

Handles user authentication, profile management, and session control.

#### Authentication Methods

```typescript
interface AuthService {
  // Authentication
  handleLogin(credentials: LoginRequest): Promise<AuthResult>;
  handleRegister(userData: RegisterRequest): Promise<AuthResult>;
  handleLogout(): Promise<{ success: boolean; error?: any }>;

  // Profile Management
  getCurrentUser(): Promise<{ success: boolean; user?: User; error?: any }>;
  updateProfile(
    updates: UpdateProfileRequest
  ): Promise<{ success: boolean; user?: User; error?: any }>;

  // Session Management
  isAuthenticated(): boolean;
  isAdmin(): Promise<boolean>;
  setToken(token: string, expiresIn?: number): void;
  clearToken(): void;
  refreshTokenIfNeeded(): Promise<boolean>;
  restoreSession(): Promise<boolean>;

  // Utility
  getBaseURL(): string;
  setBaseURL(baseURL: string): void;
}
```

#### Authentication Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  connectedDatabases: string[];
  createdAt: Date;
  lastActive: Date;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  expiresIn?: number;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

#### Authentication Usage Examples

```typescript
// Login
const result = await authService.handleLogin({
  email: 'user@example.com',
  password: 'password123',
});

// Register
const registerResult = await authService.handleRegister({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
});

// Get current user
const userResult = await authService.getCurrentUser();
if (userResult.success) {
  console.log('Current user:', userResult.user);
}

// Update profile
const updateResult = await authService.updateProfile({
  name: 'John Smith',
});
```

### 2. AnalyticsService

Provides search analytics, trends, and AI-generated insights.

#### Analytics Methods

```typescript
interface AnalyticsService {
  getDashboardAnalytics(request: DashboardAnalyticsRequest): Promise<ApiResponse<AnalyticsData>>;
  getTrends(request: TrendsRequest): Promise<ApiResponse<AnalyticsTrends>>;
  getInsights(request: InsightsRequest): Promise<ApiResponse<AnalyticsInsights>>;
  getPerformanceMetrics(request: PerformanceMetricsRequest): Promise<ApiResponse<any>>;
  getSearchHistory(query?: AnalyticsQuery): Promise<ApiResponse<any[]>>;
  getUsageStats(period?: string): Promise<ApiResponse<any>>;
}
```

#### Analytics Types

```typescript
interface AnalyticsData {
  summary: {
    totalQueries: number;
    averageResponseTime: number;
    successRate: number;
    activeUsers: number;
    databasesSearched: number;
    topQuery?: string;
    queryDistribution?: Record<string, number>;
  };
  trends?: AnalyticsTrends;
  insights?: AnalyticsInsight[];
}

interface DashboardAnalyticsRequest {
  period: 'day' | 'week' | 'month' | 'year';
  includeInsights?: boolean;
  includeTrends?: boolean;
}

interface AnalyticsQuery {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  database?: string;
  limit?: number;
}

interface AnalyticsInsight {
  title: string;
  description: string;
  confidence: number;
  category: string;
  action?: string;
  impact?: string;
}
```

#### Analytics Usage Examples

```typescript
// Get dashboard analytics
const analytics = await analyticsService.getDashboardAnalytics({
  period: 'week',
  includeInsights: true,
  includeTrends: true,
});

// Get trends
const trends = await analyticsService.getTrends({
  period: 'month',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});

// Get search history
const history = await analyticsService.getSearchHistory({
  period: 'day',
  limit: 50,
});
```

### 3. ApiKeysService

Manages API keys for programmatic access.

#### API Keys Methods

```typescript
interface ApiKeysService {
  createApiKey(
    keyData: CreateApiKeyRequest
  ): Promise<ApiResponse<{ apiKey: ApiKey; secretKey: string }>>;
  listApiKeys(): Promise<ApiResponse<ApiKey[]>>;
  updateApiKey(keyId: string, updates: UpdateApiKeyRequest): Promise<ApiResponse<ApiKey>>;
  getApiKeyUsage(keyId: string): Promise<ApiResponse<ApiKeyUsage>>;
  regenerateApiKey(keyId: string): Promise<ApiResponse<{ secretKey: string }>>;
  revokeApiKey(keyId: string): Promise<ApiResponse<void>>;
}
```

#### API Keys Types

```typescript
interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  environment: 'test' | 'live';
  permissions: string[];
  rateLimitTier: 'free' | 'pro' | 'enterprise';
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateApiKeyRequest {
  name: string;
  environment: 'test' | 'live';
  permissions?: string[];
  rateLimitTier?: 'free' | 'pro' | 'enterprise';
  expiresAt?: string;
}

interface ApiKeyUsage {
  keyId: string;
  totalRequests: number;
  requestsThisMonth: number;
  lastUsed?: string;
  rateLimitTier: 'free' | 'pro' | 'enterprise';
  quotaUsed: number;
  quotaLimit: number;
}
```

#### API Keys Usage Examples

```typescript
// Create API key
const newKey = await apiKeysService.createApiKey({
  name: 'Production API Key',
  environment: 'live',
  permissions: ['search', 'analytics'],
  rateLimitTier: 'pro',
});

// List all keys
const keys = await apiKeysService.listApiKeys();

// Get usage stats
const usage = await apiKeysService.getApiKeyUsage('key-id');

// Regenerate key
const regenerated = await apiKeysService.regenerateApiKey('key-id');
```

### 4. DatabaseService

Manages database connections for search indexing.

#### Database Methods

```typescript
interface DatabaseService {
  addDatabaseConnection(
    connectionData: AddDatabaseConnectionRequest
  ): Promise<ApiResponse<DatabaseConnection>>;
  listDatabaseConnections(): Promise<ApiResponse<DatabaseConnection[]>>;
  updateDatabaseConnection(
    connectionId: string,
    updates: UpdateDatabaseConnectionRequest
  ): Promise<ApiResponse<DatabaseConnection>>;
  removeDatabaseConnection(connectionId: string): Promise<ApiResponse<void>>;
  testDatabaseConnection(connectionId: string): Promise<ApiResponse<ConnectionTestResult>>;
  getDatabaseSchema(connectionId: string): Promise<ApiResponse<DatabaseSchema>>;
}
```

#### Database Types

```typescript
interface DatabaseConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
  isActive: boolean;
  lastConnected?: string;
  createdAt: string;
  updatedAt: string;
}

interface AddDatabaseConnectionRequest {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

interface ConnectionTestResult {
  connected: boolean;
  message?: string;
  responseTime?: number;
  version?: string;
  suggestion?: string;
}

interface DatabaseSchema {
  tables: DatabaseTable[];
  recommendations?: SchemaRecommendation[];
}

interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  fulltextIndexes?: FulltextIndex[];
}
```

#### Database Usage Examples

```typescript
// Add database connection
const connection = await databaseService.addDatabaseConnection({
  name: 'Production DB',
  host: 'db.example.com',
  port: 3306,
  database: 'myapp',
  username: 'dbuser',
  password: 'dbpass',
  ssl: true,
});

// Test connection
const testResult = await databaseService.testDatabaseConnection('conn-id');

// Get schema
const schema = await databaseService.getDatabaseSchema('conn-id');
```

### 5. ManagementService

Handles system health checks and management operations.

#### Management Methods

```typescript
interface ManagementService {
  testConnection(): Promise<ApiResponse<ConnectionTestResult>>;
  getSystemStatus(): Promise<ApiResponse<SystemStatus>>;
  setup(setupData: SetupRequest): Promise<ApiResponse<any>>;
  getMetrics(): Promise<ApiResponse<any>>;
}
```

#### Management Types

```typescript
interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceStatus[];
  uptime: number;
  version: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  message?: string;
}

interface SetupRequest {
  apiKey?: string;
  environment?: 'development' | 'staging' | 'production';
  features?: string[];
}
```

#### Management Usage Examples

```typescript
// Test API connection
const connectionTest = await managementService.testConnection();

// Get system status
const status = await managementService.getSystemStatus();

// Setup initial configuration
const setup = await managementService.setup({
  environment: 'production',
  features: ['analytics', 'search'],
});
```

### 6. Complete SDK Class (Altus4SDK)

For convenience, use the main SDK class that includes all services:

```typescript
import { Altus4SDK } from '@altus4/sdk';

const sdk = new Altus4SDK({
  baseURL: 'https://api.your-domain.com/api/v1'
});

// Access all services
sdk.auth.handleLogin({ email: '...', password: '...' });
sdk.analytics.getDashboardAnalytics({ period: 'week' });
sdk.apiKeys.createApiKey({ name: '...', environment: 'live' });
sdk.database.addDatabaseConnection({ ... });
sdk.management.getSystemStatus();

// Convenience methods
await sdk.login('email', 'password');
await sdk.register('name', 'email', 'password');
const isAuth = sdk.isAuthenticated();
```

### 7. Common Types

```typescript
// Standard API response wrapper
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

// Pagination
interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Common enums
type UserRole = 'admin' | 'user';
type Environment = 'test' | 'live';
type RateLimitTier = 'free' | 'pro' | 'enterprise';
type Period = 'day' | 'week' | 'month' | 'year';
type SearchMode = 'natural' | 'boolean' | 'semantic';
```

### 8. Error Handling

All SDK methods return promises with standardized error handling:

```typescript
// Error codes
const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// Error handling example
try {
  const result = await sdk.analytics.getDashboardAnalytics({ period: 'week' });

  if (result.success) {
    console.log('Data:', result.data);
  } else {
    console.error('Error:', result.error?.message);
  }
} catch (error) {
  console.error('Network or unexpected error:', error);
}
```

### 9. TypeScript Integration

For full TypeScript support, import types as needed:

```typescript
import {
  User,
  ApiKey,
  DatabaseConnection,
  AnalyticsData,
  LoginRequest,
  CreateApiKeyRequest,
  AddDatabaseConnectionRequest,
} from '@altus4/sdk';

// Type-safe service calls
const loginData: LoginRequest = {
  email: 'user@example.com',
  password: 'password123',
};

const apiKeyData: CreateApiKeyRequest = {
  name: 'My API Key',
  environment: 'live',
  permissions: ['search', 'analytics'],
};
```

## 🎯 **JWT Token Issue Resolution Summary**

### **Problem Resolved**

The JWT token persistence issue has been **completely fixed** with the enhanced token management system.

### **What Was Fixed**

- ✅ **Token Persistence**: Tokens now survive page refreshes and browser restarts
- ✅ **Cross-Instance Sharing**: All SDK instances automatically share the same token
- ✅ **Reactive State Management**: Vue components update correctly when auth state changes
- ✅ **Debug Tools**: Built-in debugging utilities for development
- ✅ **Error Recovery**: Better error handling and token refresh logic

### **Key New Features**

1. **TokenStorageManager**: Centralized token management across all SDK instances
2. **Automatic Token Restoration**: New SDK instances automatically load existing tokens
3. **Enhanced Plugin**: Reactive authentication state throughout your Vue.js app
4. **Debug Mode**: Development tools for easier troubleshooting

### **Migration Steps**

1. **Update your SDK**: `npm run build` in the SDK directory
2. **Replace your Vue.js plugin**: Use the enhanced plugin code above
3. **Update your composables**: Use the new `useAuth()` composable
4. **Test token persistence**: Login → refresh page → should stay logged in

### **Testing Checklist**

- [ ] Login works correctly
- [ ] Page refresh maintains authentication
- [ ] New browser tabs maintain authentication
- [ ] Browser restart maintains authentication (if using refresh cookies)
- [ ] Debug tools work in development mode
- [ ] Error handling works correctly

Your JWT token management is now production-ready with robust persistence and proper Vue.js integration! 🚀

## 🔧 **Troubleshooting & Common Issues**

### Issue: "Token not found after page refresh"

**Solution**:

- Ensure you're using the enhanced plugin (not creating multiple SDK instances)
- Check that `TokenStorageManager.hasValidToken()` returns true
- Verify localStorage contains `altus4_auth_data`

### Issue: "Authentication not working across tabs"

**Solution**:

- The new TokenStorageManager shares tokens via window-level storage and localStorage
- Check browser console for any storage errors
- Ensure you're not running in incognito mode which has storage limitations

### Issue: "Logged out after browser restart"

**Solution**:

- Check that your server is setting HttpOnly refresh cookies correctly
- Verify the cookie has proper `Secure`, `HttpOnly`, and `SameSite` attributes
- Test the `/auth/refresh` endpoint manually

### Issue: "Vue components not updating when auth state changes"

**Solution**:

- Ensure you're using the reactive `authState` from the plugin
- Check that you're importing `useAuth()` from the correct path
- Verify the plugin is properly installed in `main.ts`

## 🚀 **Production Deployment Tips**

### Environment Variables

```bash
# Production .env
VITE_ALTUS4_API_URL=https://api.your-domain.com/api/v1
VITE_APP_DEBUG=false

# Staging .env
VITE_ALTUS4_API_URL=https://staging-api.your-domain.com/api/v1
VITE_APP_DEBUG=true
```

### Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Cookie Security**: Ensure refresh cookies have `Secure; HttpOnly; SameSite=Lax` flags
3. **Token Expiry**: Use short-lived access tokens (15-60 minutes)
4. **Debug Mode**: Disable debug mode in production
5. **CSP Headers**: Configure Content Security Policy headers

### Performance Optimization

1. **Lazy Loading**: Use Vue's lazy loading for authenticated routes
2. **Token Caching**: The SDK automatically handles token caching
3. **Request Batching**: Use the SDK's built-in request batching when available
4. **Error Boundaries**: Implement proper error boundaries for API failures

## 📱 **Mobile & PWA Considerations**

### Service Worker Integration

```javascript
// In your service worker
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_AUTH') {
    // Clear any cached auth data
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('auth')) {
          caches.delete(cacheName);
        }
      });
    });
  }
});
```

### Offline Handling

```typescript
// In your auth composable
const handleOfflineAuth = () => {
  // Check if we have a valid token for offline use
  if (!navigator.onLine && TokenStorageManager.hasValidToken()) {
    return true; // Allow offline usage with cached token
  }
  return false;
};
```

## 🧪 **Testing Your Integration**

### Unit Testing

```typescript
// tests/composables/useAuth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from '@/composables/useAuth';

// Mock the plugin
vi.mock('@/plugins/altus4', () => ({
  authState: {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  },
}));

describe('useAuth', () => {
  it('should return auth state correctly', () => {
    const { isAuthenticated, user } = useAuth();
    expect(isAuthenticated.value).toBe(false);
    expect(user.value).toBe(null);
  });
});
```

### E2E Testing

```typescript
// cypress/integration/auth.spec.ts
describe('Authentication Flow', () => {
  it('should maintain login state after page refresh', () => {
    cy.visit('/login');
    cy.get('[data-cy=email]').type('user@example.com');
    cy.get('[data-cy=password]').type('password');
    cy.get('[data-cy=login-button]').click();

    cy.url().should('include', '/dashboard');
    cy.reload();
    cy.url().should('include', '/dashboard'); // Should stay logged in
  });
});
```

## 🔗 **Integration with Other Libraries**

### Pinia Store Integration

```typescript
// stores/user.ts
import { defineStore } from 'pinia';
import { useAuth } from '@/composables/useAuth';

export const useUserStore = defineStore('user', () => {
  const auth = useAuth();

  // Computed properties based on auth state
  const userRole = computed(() => auth.user.value?.role);
  const canAccessAdmin = computed(() => userRole.value === 'admin');

  return { userRole, canAccessAdmin };
});
```

### Vue Query/TanStack Query

```typescript
// composables/useAuthQuery.ts
import { useQuery } from '@tanstack/vue-query';
import { useAuth } from '@/composables/useAuth';

export function useUserProfile() {
  const { sdk, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await sdk.auth.getCurrentUser();
      if (!response.success) throw new Error(response.error?.message);
      return response.user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## 📈 **Monitoring & Analytics**

### Error Tracking

```typescript
// plugins/sentry.ts (if using Sentry)
import { useAuth } from '@/composables/useAuth';

const auth = useAuth();

// Track auth errors
auth.error.value && Sentry.captureException(new Error(auth.error.value));

// Set user context
if (auth.user.value) {
  Sentry.setUser({
    id: auth.user.value.id,
    email: auth.user.value.email,
  });
}
```

### Performance Monitoring

```typescript
// Track auth performance
const authPerformance = {
  loginStart: Date.now(),
  loginEnd: 0,

  trackLogin() {
    this.loginEnd = Date.now();
    console.log(`Login took ${this.loginEnd - this.loginStart}ms`);
  },
};
```

This comprehensive guide now covers everything you need for a production-ready Vue.js integration with the Altus4 SDK! 🎉
