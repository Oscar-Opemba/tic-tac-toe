import { ArrowLeft, CalendarDays, CircleDot, Crown, Grid3X3, Paintbrush, Sparkles, Swords, Target, Trophy } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

const avatarOptions = ["TARGET", "DIAGONAL", "GRID", "DOT"] as const;
const colorOptions = ["VERMILION", "ULTRAMARINE", "SAFFRON", "MINT", "VIOLET"] as const;

function outcomeLabel(outcome: "wins" | "losses" | "draws") {
  return outcome === "wins" ? "Won" : outcome === "losses" ? "Lost" : "Draw";
}

function avatarIcon(avatar: (typeof avatarOptions)[number]) {
  if (avatar === "GRID") return <Grid3X3 size={28} aria-hidden="true" />;
  if (avatar === "DOT") return <CircleDot size={30} aria-hidden="true" />;
  if (avatar === "DIAGONAL") return <Sparkles size={29} aria-hidden="true" />;
  return <Target size={29} aria-hidden="true" />;
}

export default function PlayerProfile() {
  const [, params] = useRoute("/players/:name");
  const playerName = params?.name ? decodeURIComponent(params.name) : "";
  const profileQuery = trpc.leaderboard.profile.useQuery({ playerName }, { enabled: Boolean(playerName) });
  const profileUtils = trpc.useUtils();
  const styleMutation = trpc.leaderboard.updateStyle.useMutation({ onSuccess: () => profileUtils.leaderboard.profile.invalidate({ playerName }) });
  const profile = profileQuery.data;

  const saveStyle = (style: { avatar?: (typeof avatarOptions)[number]; cardColor?: (typeof colorOptions)[number] }) => {
    if (!profile) return;
    styleMutation.mutate({
      playerName,
      avatar: style.avatar ?? profile.identity.avatar,
      cardColor: style.cardColor ?? profile.identity.cardColor,
    });
  };

  return (
    <main className="profile-page">
      <div className="profile-orbit profile-orbit-a" aria-hidden="true" />
      <div className="profile-orbit profile-orbit-b" aria-hidden="true" />
      <div className="profile-frame">
        <header className="profile-header">
          <Link href="/" className="profile-back"><ArrowLeft size={16} aria-hidden="true" /> Back to table</Link>
          <span>MARK/<em>THREE</em> · Public card</span>
        </header>

        {profileQuery.isPending ? (
          <section className="profile-loading"><p>Preparing the player card…</p></section>
        ) : !profile ? (
          <section className="profile-empty">
            <p className="eyebrow"><Crown size={14} aria-hidden="true" /> Public player card</p>
            <h1>No rounds recorded for <span>{playerName || "this player"}</span>.</h1>
            <p>Finish a game at the table to begin building this card.</p>
            <Link href="/" className="profile-primary">Return to the table</Link>
          </section>
        ) : (
          <>
            <section className={`profile-hero player-tone-${profile.identity.cardColor.toLowerCase()}`}>
              <div className={`profile-avatar avatar-${profile.identity.avatar.toLowerCase()}`}>{avatarIcon(profile.identity.avatar)}</div>
              <p className="eyebrow"><Crown size={14} aria-hidden="true" /> Public player card</p>
              <h1>{profile.playerName}</h1>
              <p>Every finished round leaves a line on this card.</p>
              <div className="profile-rate"><strong>{profile.winRate}%</strong><span>win rate<br />across {profile.games} rounds</span></div>
            </section>

            <section className="identity-workshop" aria-labelledby="identity-title">
              <div><h2 id="identity-title"><Paintbrush size={16} aria-hidden="true" /> Card workshop</h2><p>Choose the geometric mark and color that follows this player through the table.</p></div>
              <div className="identity-controls">
                <div className="identity-options" role="group" aria-label="Choose player avatar">
                  {avatarOptions.map(avatar => <button key={avatar} type="button" className={`avatar-choice avatar-${avatar.toLowerCase()} ${profile.identity.avatar === avatar ? "is-selected" : ""}`} onClick={() => saveStyle({ avatar })} aria-label={`${avatar.toLowerCase()} avatar`} aria-pressed={profile.identity.avatar === avatar}>{avatarIcon(avatar)}</button>)}
                </div>
                <div className="identity-options color-options" role="group" aria-label="Choose player card color">
                  {colorOptions.map(color => <button key={color} type="button" className={`color-choice color-${color.toLowerCase()} ${profile.identity.cardColor === color ? "is-selected" : ""}`} onClick={() => saveStyle({ cardColor: color })} aria-label={`${color.toLowerCase()} player-card color`} aria-pressed={profile.identity.cardColor === color} />)}
                </div>
              </div>
              {styleMutation.isPending && <span className="style-status">Pressing your card…</span>}
              {styleMutation.isSuccess && <span className="style-status is-saved">Card identity saved.</span>}
              {styleMutation.isError && <span className="style-status is-error">Card identity could not be saved.</span>}
            </section>

            <section className="profile-grid">
              <div className="profile-scorecard" aria-label="Player performance summary">
                <div><span>Wins</span><b>{profile.wins}</b></div>
                <div><span>Losses</span><b>{profile.losses}</b></div>
                <div><span>Draws</span><b>{profile.draws}</b></div>
              </div>

              <section className="history-card" aria-labelledby="history-title">
                <div className="history-heading"><h2 id="history-title"><Swords size={17} aria-hidden="true" /> Match history</h2><span>Latest {profile.history.length}</span></div>
                <ol className="history-list">
                  {profile.history.map((match) => (
                    <li key={match.id}>
                      <span className={`history-outcome outcome-${match.outcome}`}>{outcomeLabel(match.outcome)}</span>
                      <div><b>vs. {match.opponentName}</b><small>{match.gameMode === "AI" ? `${match.difficulty.toLowerCase()} house` : "local table"}</small></div>
                      <time dateTime={match.playedAt.toISOString()}><CalendarDays size={13} aria-hidden="true" /> {new Date(match.playedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                    </li>
                  ))}
                </ol>
              </section>
            </section>

            <section className="rivalry-card" aria-labelledby="rivalry-title">
              <div className="rivalry-heading"><h2 id="rivalry-title"><Swords size={17} aria-hidden="true" /> Table rivals</h2><p>Head-to-head lines, one opponent at a time.</p></div>
              <div className="rivalry-list">
                {profile.rivalries.map(rivalry => (
                  <article key={rivalry.opponentName}>
                    <div><span>vs.</span><h3>{rivalry.opponentName}</h3></div>
                    <p><b>{rivalry.wins}</b>W · <b>{rivalry.losses}</b>L · <b>{rivalry.draws}</b>D</p>
                    <em>{rivalry.winRate}% line rate<br />{rivalry.games} games</em>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="profile-footer"><Trophy size={14} aria-hidden="true" /> A public card for quick games and long rivalries.</footer>
      </div>
    </main>
  );
}
