/**
 * Altus 4 SDK Types
 *
 * Centralized export of all TypeScript types and interfaces used in the SDK.
 */

// Common types and enums
export * from './common';

// Authentication types
export * from './auth';

// API Key management types
export * from './api-keys';

// Database connection types
export * from './database';

// Analytics types
export * from './analytics';

// Management types (excluding ConnectionTestResult to avoid conflict)
export type { SystemStatus, ServiceStatus, SetupRequest } from './management';

// Client configuration (re-export from client module)
export type { ClientConfig } from '../client/config';
