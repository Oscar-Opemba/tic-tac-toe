import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getPublicPlayerProfile, listLeaderboard, listSeasons, recordLeaderboardResult, updatePlayerStyle } from "./db";
import { leaderboardListSchema, leaderboardRecordSchema, playerProfileSchema, playerStyleSchema } from "../shared/leaderboard";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  leaderboard: router({
    list: publicProcedure.input(leaderboardListSchema).query(async ({ input }) => listLeaderboard(input.period, input.seasonKey)),
    seasons: publicProcedure.query(async () => listSeasons()),
    record: publicProcedure.input(leaderboardRecordSchema).mutation(async ({ input }) => ({
      stored: await recordLeaderboardResult(input),
    })),
    profile: publicProcedure.input(playerProfileSchema).query(async ({ input }) => getPublicPlayerProfile(input.playerName)),
    updateStyle: publicProcedure.input(playerStyleSchema).mutation(async ({ input }) => ({ stored: await updatePlayerStyle(input) })),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
