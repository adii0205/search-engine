/**
 * Database Client
 * Manages PostgreSQL connection and migrations
 */

import pg from 'pg'
import { getConfig } from '../config.js'

const { Pool } = pg

let pool: pg.Pool

export async function initDb(): Promise<pg.Pool> {
  if (pool) return pool

  const config = getConfig()

  pool = new Pool({
    connectionString: config.DATABASE_URL,
  })

  // Test connection
  try {
    const client = await pool.connect()
    console.log('✅ PostgreSQL connected')
    client.release()
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error)
    throw error
  }

  return pool
}

export async function getDb(): Promise<pg.Pool> {
  if (!pool) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return pool
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end()
  }
}

// Query helper
export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
  const db = await getDb()
  const result = await db.query(sql, params)
  return result.rows as T[]
}

// Single row
export async function queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sql, params)
  return results[0] || null
}

// Insert/Update/Delete
export async function execute(sql: string, params?: any[]): Promise<number> {
  const db = await getDb()
  const result = await db.query(sql, params)
  return result.rowCount || 0
}
