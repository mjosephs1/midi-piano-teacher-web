import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'midi_piano_teacher',
  user:     'user',
  password: 'password',
});

export const db = drizzle(pool, { schema });
