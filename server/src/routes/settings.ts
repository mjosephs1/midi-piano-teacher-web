import { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { userSettings } from '../schema';

const USER_ID = 0;

type SettingsPatch = Partial<Omit<typeof userSettings.$inferInsert, 'userId'>>;

const settingsRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', async () => {
    const [row] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, USER_ID));
    return row;
  });

  server.patch('/', async (request) => {
    const body = request.body as SettingsPatch;
    const [row] = await db
      .update(userSettings)
      .set(body)
      .where(eq(userSettings.userId, USER_ID))
      .returning();
    return row;
  });
};

export default settingsRoutes;
