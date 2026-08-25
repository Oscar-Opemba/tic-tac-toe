import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, leaderboardEntries, matchHistory, playerProfiles, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { LeaderboardOutcome, LeaderboardPeriod, PlayerAvatar, PlayerCardColor } from "../shared/leaderboard";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  textFields.forEach((field: TextField) => {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

function leaderboardSince(period: LeaderboardPeriod) {
  if (period === "ALL_TIME") return undefined;
  const since = new Date();
  since.setDate(since.getDate() - (period === "WEEKLY" ? 7 : 30));
  return since;
}

const winsTotal = sql<number>`sum(case when ${matchHistory.outcome} = 'wins' then 1 else 0 end)`;
const lossesTotal = sql<number>`sum(case when ${matchHistory.outcome} = 'losses' then 1 else 0 end)`;
const drawsTotal = sql<number>`sum(case when ${matchHistory.outcome} = 'draws' then 1 else 0 end)`;
const gamesTotal = sql<number>`count(*)`;
const profileDefaults = { avatar: "TARGET" as PlayerAvatar, cardColor: "VERMILION" as PlayerCardColor };

export function currentSeasonKey(date = new Date()) {
  return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
}

function seasonLabel(seasonKey: string) {
  if (seasonKey === "ARCHIVE") return "Early archive";
  const match = seasonKey.match(/^(\d{4})-Q([1-4])$/);
  return match ? `Season ${match[1]} · ${match[2]}` : seasonKey;
}

export async function listLeaderboard(period: LeaderboardPeriod, seasonKey?: string) {
  const db = await getDb();
  if (!db) return [];

  const query = db
    .select({
      playerName: matchHistory.playerName,
      wins: winsTotal,
      losses: lossesTotal,
      draws: drawsTotal,
      games: gamesTotal,
      lastPlayed: sql<Date>`max(${matchHistory.playedAt})`,
    })
    .from(matchHistory)
    .$dynamic();

  if (seasonKey) query.where(eq(matchHistory.seasonKey, seasonKey));
  else {
    const since = leaderboardSince(period);
    if (since) query.where(gte(matchHistory.playedAt, since));
  }

  const rows = await query
    .groupBy(matchHistory.playerName)
    .orderBy(desc(winsTotal), asc(lossesTotal), desc(drawsTotal), desc(sql`max(${matchHistory.playedAt})`))
    .limit(10);

  return rows.map(row => ({ ...row, wins: Number(row.wins), losses: Number(row.losses), draws: Number(row.draws), games: Number(row.games) }));
}

export async function listSeasons() {
  const db = await getDb();
  const current = currentSeasonKey();
  if (!db) return [{ key: current, label: seasonLabel(current), archived: false, games: 0, lastPlayed: null }];

  const rows = await db
    .select({ key: matchHistory.seasonKey, games: gamesTotal, lastPlayed: sql<Date>`max(${matchHistory.playedAt})` })
    .from(matchHistory)
    .groupBy(matchHistory.seasonKey)
    .orderBy(desc(sql`max(${matchHistory.playedAt})`));
  const seasons = rows.map(row => ({ key: row.key, label: seasonLabel(row.key), archived: row.key !== current, games: Number(row.games), lastPlayed: row.lastPlayed }));
  return seasons.some(season => season.key === current)
    ? seasons
    : [{ key: current, label: seasonLabel(current), archived: false, games: 0, lastPlayed: null }, ...seasons];
}

export async function getPublicPlayerProfile(playerName: string) {
  const db = await getDb();
  if (!db) return undefined;

  const history = await db.select().from(matchHistory).where(eq(matchHistory.playerName, playerName)).orderBy(desc(matchHistory.playedAt)).limit(12);
  if (!history.length) return undefined;

  const identityRows = await db.select().from(playerProfiles).where(eq(playerProfiles.playerName, playerName)).limit(1);
  const identity = identityRows[0] ?? { playerName, ...profileDefaults };
  const totals = await db.select({ wins: winsTotal, losses: lossesTotal, draws: drawsTotal, games: gamesTotal }).from(matchHistory).where(eq(matchHistory.playerName, playerName));
  const summary = totals[0];
  const games = Number(summary?.games ?? 0);
  const wins = Number(summary?.wins ?? 0);

  const rivalryRows = await db
    .select({ opponentName: matchHistory.opponentName, wins: winsTotal, losses: lossesTotal, draws: drawsTotal, games: gamesTotal })
    .from(matchHistory)
    .where(eq(matchHistory.playerName, playerName))
    .groupBy(matchHistory.opponentName)
    .orderBy(desc(winsTotal), asc(lossesTotal), desc(gamesTotal));
  const rivalries = rivalryRows.map(row => {
    const rivalryGames = Number(row.games);
    const rivalryWins = Number(row.wins);
    return { opponentName: row.opponentName, wins: rivalryWins, losses: Number(row.losses), draws: Number(row.draws), games: rivalryGames, winRate: rivalryGames ? Math.round((rivalryWins / rivalryGames) * 100) : 0 };
  });

  return {
    playerName,
    identity: { avatar: identity.avatar as PlayerAvatar, cardColor: identity.cardColor as PlayerCardColor },
    wins,
    losses: Number(summary?.losses ?? 0),
    draws: Number(summary?.draws ?? 0),
    games,
    winRate: games ? Math.round((wins / games) * 100) : 0,
    history,
    rivalries,
  };
}

export async function updatePlayerStyle(input: { playerName: string; avatar: PlayerAvatar; cardColor: PlayerCardColor }) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(playerProfiles).values(input).onDuplicateKeyUpdate({ set: { avatar: input.avatar, cardColor: input.cardColor, updatedAt: new Date() } });
  return true;
}

async function ensurePlayerProfile(playerName: string) {
  if (playerName === "The house") return;
  const db = await getDb();
  if (!db) return;
  await db.insert(playerProfiles).values({ playerName, ...profileDefaults }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
}

export async function recordLeaderboardResult(input: {
  playerName: string;
  opponentName: string;
  outcome: LeaderboardOutcome;
  gameMode: "LOCAL" | "AI";
  difficulty: "LOCAL" | "EASY" | "HARD";
}) {
  const db = await getDb();
  if (!db) return false;

  const base = { playerName: input.playerName, wins: input.outcome === "wins" ? 1 : 0, losses: input.outcome === "losses" ? 1 : 0, draws: input.outcome === "draws" ? 1 : 0 };
  const increment = input.outcome === "wins"
    ? { wins: sql`${leaderboardEntries.wins} + 1` }
    : input.outcome === "losses"
      ? { losses: sql`${leaderboardEntries.losses} + 1` }
      : { draws: sql`${leaderboardEntries.draws} + 1` };

  await db.insert(leaderboardEntries).values(base).onDuplicateKeyUpdate({ set: { ...increment, updatedAt: new Date() } });
  await ensurePlayerProfile(input.playerName);
  await ensurePlayerProfile(input.opponentName);
  await db.insert(matchHistory).values({ ...input, seasonKey: currentSeasonKey() });
  return true;
}
