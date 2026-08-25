import { z } from "zod";

export const leaderboardOutcomeSchema = z.enum(["wins", "losses", "draws"]);
export type LeaderboardOutcome = z.infer<typeof leaderboardOutcomeSchema>;

export const leaderboardPeriodSchema = z.enum(["ALL_TIME", "MONTHLY", "WEEKLY"]);
export type LeaderboardPeriod = z.infer<typeof leaderboardPeriodSchema>;

export const playerAvatarSchema = z.enum(["TARGET", "DIAGONAL", "GRID", "DOT"]);
export const playerCardColorSchema = z.enum(["VERMILION", "ULTRAMARINE", "SAFFRON", "MINT", "VIOLET"]);
export type PlayerAvatar = z.infer<typeof playerAvatarSchema>;
export type PlayerCardColor = z.infer<typeof playerCardColorSchema>;

export const leaderboardEntrySchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters")
    .max(24, "Use 24 characters or fewer")
    .regex(/^[A-Za-z0-9 .'-]+$/, "Use letters, numbers, spaces, apostrophes, dots, or hyphens"),
  outcome: leaderboardOutcomeSchema,
});

export const leaderboardRecordSchema = leaderboardEntrySchema.extend({
  opponentName: z.string().trim().min(2).max(24),
  gameMode: z.enum(["LOCAL", "AI"]),
  difficulty: z.enum(["LOCAL", "EASY", "HARD"]),
});

export const playerProfileSchema = z.object({
  playerName: leaderboardEntrySchema.shape.playerName,
});

export const playerStyleSchema = playerProfileSchema.extend({
  avatar: playerAvatarSchema,
  cardColor: playerCardColorSchema,
});

export const leaderboardListSchema = z.object({
  period: leaderboardPeriodSchema,
  seasonKey: z.string().trim().min(1).max(16).optional(),
});
