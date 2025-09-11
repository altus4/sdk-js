/**
 * Database connection types for the Altus 4 SDK
 */

/**
 * Database connection entity
 */
export interface DatabaseConnection {
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

/**
 * Add database connection request
 */
export interface AddDatabaseConnectionRequest {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

/**
 * Update database connection request
 */
export interface UpdateDatabaseConnectionRequest {
  name?: string;
  host?: string;
  port?: number;
  ssl?: boolean;
  isActive?: boolean;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  connected: boolean;
  message?: string;
  responseTime?: number;
  version?: string;
  suggestion?: string;
}

/**
 * Database schema information
 */
export interface DatabaseSchema {
  tables: DatabaseTable[];
  recommendations?: SchemaRecommendation[];
}

/**
 * Database table information
 */
export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  fulltextIndexes?: FulltextIndex[];
}

/**
 * Database column information
 */
export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
}

/**
 * Fulltext index information
 */
export interface FulltextIndex {
  name: string;
  columns: string[];
}

/**
 * Schema optimization recommendation
 */
export interface SchemaRecommendation {
  type: string;
  description: string;
  query?: string;
}
