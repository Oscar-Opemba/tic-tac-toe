# Tic-Tac-Toe — Design Directions

## Three Candidate Approaches

### Theme Name: Bauhaus Game Night
**Very Brief Intro:** A tactile, gallery-poster interpretation of the classic game: oversized geometric marks, rich paper tones, and deliberate asymmetry. It should feel playful without looking childish.

**Probability:** 0.07

### Theme Name: Quiet Chess Club
**Very Brief Intro:** A warm, low-contrast tabletop experience with measured typography and an almost editorial sense of calm. The interface feels like a small private members’ game room.

**Probability:** 0.04

### Theme Name: Arcade Field Notes
**Very Brief Intro:** A bright, kinetic game sheet inspired by annotated sporting scorecards and printed ephemera. It treats each move as a small event, with bold scoreboard accents.

**Probability:** 0.09

## Chosen Approach: Bauhaus Game Night

### Design Movement
The design follows **Bauhaus poster design**, borrowing its confident geometry, purposeful colour blocking, and uncommon visual rhythm rather than a generic app-dashboard layout.

### Core Principles
1. Let the playing grid become the dominant piece of graphic design, not merely a control.
2. Use a small number of high-contrast colours with disciplined, substantial negative space.
3. Make game state visible through spatial shifts and tone, not crowded status messaging.
4. Keep every interaction direct, immediate, and emotionally legible.

### Color Philosophy
The visual base is **warm paper** rather than pure white, creating a physical, evening-game mood. Charcoal establishes clarity, vermilion carries the energy of X, and deep ultramarine anchors O. A restrained saffron accent marks ties and secondary moments without competing with the pieces.

### Layout Paradigm
The page uses a deliberately **off-centre editorial composition**: a narrow branded rail on larger screens, a dominant board panel that slightly overlaps its score area, and a visual field of cropped circles and diagonals in the background. Mobile collapses this to a compact, stacked composition while preserving the board’s hierarchy.

### Signature Elements
1. A thick framed 3×3 board whose marks are built from circles and crossed strokes.
2. Cropped geometric motifs that make the background read like a printed poster.
3. A stacked score strip that echoes a physical game-score card.

### Interaction Philosophy
Moves should feel decisive: the chosen square rises a fraction, then accepts its mark. The active player is identified with an unambiguous coloured bar and a succinct command-like line. Reset actions are prominent, but not visually louder than the board.

### Animation
Use a 160–220 ms snappy cubic-bezier ease-out for hover and press responses. Newly placed pieces enter from 0.94 scale with opacity and a short settle; the winning line fades in afterward. Respect `prefers-reduced-motion` by disabling nonessential transitions. There are no looping or decorative motion effects.

### Typography System
**Space Grotesk** is the geometric display face for player marks, headings, and score numerals. **DM Mono** provides compact all-caps labels, game messaging, and controls. Large headings use tight tracking; small labels use controlled wide letter spacing for a printed-game-card quality.

### Brand Essence
**A crisp, tactile reimagining of Tic-Tac-Toe for people who value a quick game with a considered point of view.**

**Personality:** assured, playful, graphic.

### Brand Voice
Headlines sound like short invitations rather than feature claims; CTAs sound like an action on a physical game table. Avoid generic app language and empty celebration.

> “Make the first mark.”

> “Clear the board. Keep the score.”

### Wordmark & Logo
The brand is called **MARK/THREE**. Its mark is an abstract black square containing an offset vermilion diagonal and ultramarine circular cut-out: a compact reference to the X/O grid with no dependent text.

### Signature Brand Color
**Signal Vermilion — `#E64A2E`** is the ownable, high-energy colour used for X, high-value actions, and active-win moments.

## Style Decisions

- A large cropped circle and a strong diagonal block are structural elements around the playing artifact, reinforcing the poster composition at every viewport size.
- Scores use enlarged Space Grotesk numerals with DM Mono player labels, presented as a printed, stacked scorecard rather than conventional statistics.
- Game-state and action copy uses short table instructions such as “Place the next mark” and “Sweep the table,” never generic application language.
