import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host:     'localhost',
    port:     5432,
    database: 'midi_piano_teacher',
    user:     'user',
    password: 'password',
  },
});
