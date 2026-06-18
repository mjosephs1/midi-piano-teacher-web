import Fastify from 'fastify';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { db } from './db';
import { userSettings } from './schema';

const server = Fastify({ logger: true });

server.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });
    server.log.info('Migrations applied');

    await db.insert(userSettings).values({ userId: 0 }).onConflictDoNothing();
    server.log.info('Default user seeded');

    await server.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
