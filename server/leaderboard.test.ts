import { describe, expect, it } from "vitest";
import { leaderboardEntrySchema, leaderboardListSchema, leaderboardRecordSchema, playerStyleSchema } from "../shared/leaderboard";

describe("leaderboard entry validation", () => {
  it("trims a valid player name before it is stored", () => {
    expect(leaderboardEntrySchema.parse({ playerName: "  Ada  ", outcome: "wins" })).toEqual({
      playerName: "Ada",
      outcome: "wins",
    });
  });

  it("rejects anonymous and malformed leaderboard entries", () => {
    expect(() => leaderboardEntrySchema.parse({ playerName: " ", outcome: "wins" })).toThrow();
    expect(() => leaderboardEntrySchema.parse({ playerName: "Name <script>", outcome: "losses" })).toThrow();
  });

  it("requires match context for a profile-visible history entry", () => {
    expect(leaderboardRecordSchema.parse({
      playerName: "Ada",
      opponentName: "The house",
      outcome: "wins",
      gameMode: "AI",
      difficulty: "HARD",
    })).toMatchObject({ playerName: "Ada", gameMode: "AI" });
  });

  it("accepts an identity style and a specific seasonal leaderboard window", () => {
    expect(playerStyleSchema.parse({ playerName: "Ada", avatar: "GRID", cardColor: "MINT" })).toMatchObject({ avatar: "GRID", cardColor: "MINT" });
    expect(leaderboardListSchema.parse({ period: "ALL_TIME", seasonKey: "2026-Q3" })).toMatchObject({ seasonKey: "2026-Q3" });
  });
});
