# MateMate Implementation Plan

## Step 1 — Project scaffold
- [x] Create package.json
- [x] Create Vite config
- [x] Create TypeScript config
- [x] Create index.html
- [x] Create basic src/main.ts
- [x] Create src/styles.css
- [x] Create folder structure

Acceptance criteria:
- npm install works
- npm run dev works
- npm run build works

---

## Step 2 — Core types and storage
- [x] Create src/core/Types.ts — all shared interfaces and enums
- [x] Create src/storage/StorageService.ts — safe localStorage wrapper
- [x] Create src/storage/MigrationService.ts — version migration
- [x] Default settings defined
- [x] Save/load matemate_settings and matemate_results

Acceptance criteria:
- StorageService can save and load settings and results
- Corrupted storage is handled gracefully (reset to defaults)
- Migration runs on version mismatch

---

## Step 3 — Screen manager and welcome flow
- [x] Create src/app/ScreenManager.ts — mount/unmount screens
- [x] Create src/app/Router.ts — screen navigation
- [x] Create src/app/App.ts — root controller
- [x] Create src/screens/WelcomeScreen.ts
- [x] Fullscreen API on play button
- [x] Rotate device notice for portrait mobile

Acceptance criteria:
- App boots to WelcomeScreen
- Play button navigates to next screen
- Fullscreen request fires on desktop/mobile
- Portrait warning shown on narrow screens

---

## Step 4 — Home screen and progress chart
- [x] Create src/screens/HomeScreen.ts
- [x] Create src/chart/ProgressAggregator.ts — aggregate results by day
- [x] Create src/chart/ChartRenderer.ts — pixel-art bar chart with tooltip
- [x] Operation selector buttons (+ - × ÷)
- [x] Animal selector (dinosaur, opossum, capybara)
- [x] Settings button (leads to PIN prompt)

Acceptance criteria:
- Chart shows last 14 days of results
- Tooltip shows date + % correct on hover/tap
- Selecting animal persists to storage
- All four operations navigable from home

---

## Step 5 — Settings screen protected by PIN
- [x] Create src/screens/SettingsScreen.ts
- [x] PIN modal/overlay (hardcoded 556677)
- [x] Editable settings: timer duration, active multiplication tables
- [x] At least one multiplication table must remain selected
- [x] Save to localStorage on confirm

Acceptance criteria:
- Wrong PIN rejected
- Settings saved and reloaded on next open
- Timer options: 5s, 10s, 15s
- Multiplication tables 1–12 individually toggleable

---

## Step 6 — Question generator
- [x] Create src/math/Operations.ts — difficulty rules per operation
- [x] Create src/math/QuestionGenerator.ts — generate question by operation
- [x] Suma: 1–100 range, no negatives in result
- [x] Resta: result ≥ 0
- [x] Multiplicación: only selected tables
- [x] División: exact (no remainders), divisor from selected tables

Acceptance criteria:
- 50 unique questions generated per game session
- No duplicates within a session
- Results obey configured tables for × and ÷

---

## Step 7 — Answer generator
- [x] Create src/math/AnswerGenerator.ts
- [x] 1 correct answer
- [x] 2 plausible distractors (nearby values, common mistakes)
- [x] Shuffled order
- [x] No duplicate answers

Acceptance criteria:
- All 3 answers distinct
- Distractors within ±30% of correct answer
- Order randomized each question

---

## Step 8 — Pixel art rendering
- [x] Create src/graphics/PixelArtRenderer.ts — canvas draw utilities
- [x] Create src/graphics/SpriteFactory.ts — sprite builder
- [x] Create src/graphics/AnimalSprites.ts — dino, opossum, capybara
- [x] Create src/graphics/ObstacleSprites.ts — wall, rock, cactus sprites
- [x] Create src/graphics/Confetti.ts — particle system
- [x] Road/path background tiles
- [x] Retro UI panel borders

Acceptance criteria:
- All 3 animals render on canvas without external images
- Obstacles render
- Background scrolls or tiles correctly

---

## Step 9 — Animation system
- [x] Create src/animation/AnimationController.ts — frame loop manager
- [x] Create src/animation/AnimalAnimation.ts — run, victory, hit frames
- [x] Create src/graphics/Confetti.ts — particle confetti system
- [x] Create src/animation/DamageEffect.ts — red flash on wrong answer
- [x] Obstacle break/disappear on correct answer

Acceptance criteria:
- Animal runs continuously during question
- Correct answer triggers jump/cheer animation + confetti burst
- Wrong answer triggers red flash + collision animation
- Animations are frame-rate independent (delta time)

---

## Step 10 — Game loop
- [x] Create src/core/GameLoop.ts — requestAnimationFrame loop
- [x] Create src/core/GameState.ts — question index, score, lives
- [x] Create src/core/Timer.ts — countdown per question
- [x] Create src/core/Random.ts — seeded shuffle utility
- [x] Create src/screens/GameScreen.ts
- [x] 50 questions per session
- [x] Timer: 5/10/15s per question + 1s grace
- [x] Auto-advance after answer or timeout
- [x] Exit button mid-game

Acceptance criteria:
- Full 50-question game runs from start to finish
- Timer counts down visually
- Grace second gives brief window after timer hits 0
- Wrong answer + timeout both mark as incorrect
- Exiting mid-game does not save partial results

---

## Step 11 — Result screen and persistence
- [ ] Create src/screens/ResultScreen.ts
- [ ] Show % correct, total time, correct/incorrect counts
- [ ] Motivational message based on score band
- [ ] Auto-save attempt to matemate_results on game end
- [ ] Retry button (same operation)
- [ ] Home button

Acceptance criteria:
- Result saved with date, operation, score, time
- Chart on HomeScreen updates after returning
- Motivational message changes by score range
- Retry re-generates fresh 50 questions

---

## Step 12 — Polish and mobile UX
- [ ] Large touch-friendly buttons (min 48px tap targets)
- [ ] Responsive layout: portrait warning, horizontal game canvas
- [ ] Web Audio API sound effects (correct, wrong, tick, victory)
- [ ] Mute toggle persisted in settings
- [ ] Performance: no dropped frames on mid-range mobile
- [ ] Pixel art visual polish pass

Acceptance criteria:
- Game playable on 375×667 landscape without scroll
- Sounds play on correct/wrong/timer events
- Mute setting persists across sessions
- No console errors on mobile browsers

---

## Step 13 — Final build verification
- [ ] npm install succeeds
- [ ] npm run dev serves with no errors
- [ ] npm run build produces dist/index.html + dist/assets/
- [ ] dist/index.html opens in browser offline
- [ ] No console errors
- [ ] localStorage reads/writes verified
- [ ] All 4 operations tested end-to-end
- [ ] PIN protection verified
- [ ] Chart renders with mock historical data

Acceptance criteria:
- Single `npm run build` produces a self-contained dist/
- All 13 core mechanics present and functional
