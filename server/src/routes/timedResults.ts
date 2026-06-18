import { FastifyPluginAsync } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { timedResults } from '../schema';

const USER_ID = 0;

type TimedResultBody = {
  score: number;
  mistakes: number;
  selectedGroups: string[];
  sharpsFilter: string;
  handsMode: string;
};

type TimedResultsQuery = {
  selected_groups?: string;
  sharps_filter?: string;
  hands_mode?: string;
};

const timedResultsRoutes: FastifyPluginAsync = async (server) => {
  server.post('/', async (request, reply) => {
    const { score, mistakes, selectedGroups, sharpsFilter, handsMode } =
      request.body as TimedResultBody;

    const [row] = await db
      .insert(timedResults)
      .values({
        userId: USER_ID,
        score,
        mistakes,
        selectedGroups: [...selectedGroups].sort(),
        sharpsFilter,
        handsMode,
      })
      .returning({ id: timedResults.id, createdAt: timedResults.createdAt });

    reply.code(201);
    return row;
  });

  server.get('/', async (request) => {
    const { selected_groups, sharps_filter, hands_mode } =
      request.query as TimedResultsQuery;

    const selectedGroups = selected_groups
      ? selected_groups.split(',').sort()
      : [];

    const rows = await db
      .select()
      .from(timedResults)
      .where(
        and(
          eq(timedResults.userId, USER_ID),
          eq(timedResults.selectedGroups, selectedGroups),
          eq(timedResults.sharpsFilter, sharps_filter ?? 'with-sharps'),
          eq(timedResults.handsMode, hands_mode ?? 'right'),
        )
      );

    return rows;
  });
};

export default timedResultsRoutes;
