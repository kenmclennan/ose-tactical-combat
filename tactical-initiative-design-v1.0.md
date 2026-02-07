# OSE Tactical Initiative System - Design Companion

_Version 1.0 - Companion to [tactical-initiative-reference-v1.0.md](tactical-initiative-reference-v1.0.md)_

This document captures the design reasoning behind the Tactical Initiative System. It's written for a fellow designer or future-self iterating on the rules - explaining not just what we chose, but why, and what we considered along the way.

---

## Why This System Exists

Standard OSE initiative works like this: both sides roll 1d6, highest goes first, all actions resolve in phase order (movement, missiles, spells, melee). It's fast and simple. It's also flat.

Every round feels the same. Roll initiative, move, attack, done. There's no meaningful choice about _when_ to act or _what to sacrifice_ for speed. A fighter with a dagger and a fighter with a two-handed sword resolve in the same phase unless you use the optional "two-handed weapons go last" rule. Spellcasters declare before initiative but otherwise don't interact with the timing system in interesting ways.

The combat we wanted to capture feels different. Two fighters closing distance, one committing to a reckless charge while the other braces a spear. A magic-user holding back, waiting for the right moment to unleash a spell. A thief darting in for a quick strike and pulling back before the ogre can respond. These moments exist in fiction but not in standard OSE mechanics.

RuneQuest's Strike Rank system was the original inspiration - it makes weapon choice, movement distance, and preparation all affect when you act. But Strike Rank's bookkeeping (DEX + SIZ + weapon length + movement segments across 12 ranks) is too heavy for OSE's design philosophy. Mythras refined this into Action Points - a simpler pool you spend to do things. That concept, married to OSE's existing framework, became this system.

---

## Design Principles

These goals guided every decision:

1. **Preserve OSE's core** - Attack rolls, AC, HP, saves, damage, spells, and monster stat blocks all work unchanged. The system replaces only initiative and action economy.

2. **One number to track** - Each combatant tracks their current AP. No modifier stacking, no phase tracking, no secondary resources (except the Fury Pool, which is communal and simple).

3. **Choices create consequences** - Every action has an AP cost, and your remaining AP determines when you act next. Cheap actions keep you fast; expensive actions leave you slow. This tension is the heart of the system.

4. **Simultaneous combat is real** - Ties resolve at the same time. Mutual kills are possible. This captures the chaos and danger of melee combat better than strict turn order.

5. **Fits on paper** - The complete rules should fit on 1-2 sheets of A4. If it needs a spreadsheet, it's too complex for OSE.

6. **Reward teamwork** - Cooperative actions (Aid, Guard, formations) give players mechanical reasons to work together rather than each optimizing individually.

---

## Design Decisions

### 1. Action Points Over Standard Initiative

**Problem:** OSE's side-based initiative (roll 1d6, highest goes first) creates no per-character tactical decisions. Everyone on the winning side acts, then everyone on the losing side acts. Individual characters don't influence their own timing.

**Alternatives considered:**

- **Individual initiative (d6 + DEX mod):** OSE already offers this as an optional rule. It adds some variety but still produces a fixed order each round with no player agency over timing.
- **Phased initiative with modifiers:** Actions resolve in fixed phases (movement → missiles → spells → melee) but with timing modifiers. This preserves some structure but doesn't create the resource-management tension we wanted.
- **Countdown initiative (like Feng Shui):** Start at a number and count down, with actions dropping you further down the timeline. Close to what we built, but the "counting down from 20+" creates bigger numbers than necessary.

**Solution:** Action Point pools that serve as both a resource (what can I do?) and an initiative system (when do I act?). Your current AP total determines your place in the resolution order.

**Why:** AP pools collapse two systems into one. You don't need a separate initiative roll and a separate action economy - they're the same number. This keeps tracking minimal while creating deep tactical decisions. The highest-AP-first resolution means your remaining resources directly determine your speed.

### 2. 7 AP for Players, 6 AP for Monsters

**Problem:** The AP pool size needs to support standard combat patterns while creating interesting choices. Too few AP and every round is one action. Too many and there's no tension about what to spend.

**Alternatives considered:**

- **Equal pools (6/6 or 7/7):** Simple and symmetric. But it doesn't create the slight player advantage that makes heroic action possible.
- **Higher pools (10+):** More granularity in action costs but more math and more cycles per round, slowing play.
- **Lower pools (4-5):** Fewer options per round. Most rounds become "move and attack" with no room for tactical choices.

**Solution:** Players get 7 AP base, monsters get 6 AP base.

**Why:** 7 AP is the sweet spot for the baseline patterns we need:

- Move (3) + Attack (3) = 6 AP. Works on a bad roll.
- Half Move (2) + Attack (3) + Quick Action (2) = 7 AP. Uses a full pool efficiently.
- Charge (5) leaves 2 AP - enough to be meaningful but not enough for another attack.

The player advantage of +1 AP over monsters is small but meaningful. Players act first in ties, get one more AP to play with, and have slightly more flexibility. This creates the feeling that player characters are protagonists - competent, capable, a step ahead - without making monsters pushovers. Monsters compensate through numbers, HD, and special abilities, not through initiative superiority.

### 3. AP Variance (1d6 + DEX)

**Problem:** Fixed AP pools would make every round feel identical. Some randomness is needed to prevent optimization into rigid routines, but too much randomness undermines tactical planning.

**Alternatives considered:**

- **No variance:** Pure fixed pools. Predictable but repetitive. Players would solve the optimal action sequence and repeat it every round.
- **Full random (1d6 + base):** Too swingy. A range of 4-10 AP means you can't reliably plan multi-action sequences.
- **2d6 bell curve:** Tighter distribution but more dice rolling per combatant per round.
- **Larger variance (1d8 or 1d10):** More dramatic swings but harder to plan around.

**Solution:** Roll 1d6 each round. Most results give you your base AP unchanged. Extreme rolls (1 or 6) shift you by 1 AP. DEX modifiers widen or narrow the range slightly.

**Why:** The variance is _just enough_ to prevent scripted play without destroying planning. A standard DEX character has a 4-in-6 chance of getting their base 7 AP, with 1-in-6 chance each of 6 or 8. That means you can plan around 7 AP but can't count on it absolutely. High DEX characters skew toward 8 AP (acting first more often), low DEX toward 6 AP - a meaningful but not overwhelming difference. The 1d6 also echoes OSE's existing initiative die, keeping the feel familiar.

### 4. Round Structure with Multiple Cycles

**Problem:** A single declaration-resolution pass per round would mean one action per round - no different from standard initiative. Multiple actions per round are needed to create the resource-management tension that makes AP meaningful.

**Alternatives considered:**

- **Single action per round:** Simple but wastes the AP system. No reason to have 7 AP if you only act once.
- **Declare all actions upfront:** Declare your entire round's worth of actions at once. Realistic (commit to a plan) but creates information overload and removes the ability to react to changing circumstances.
- **Free-form spending:** No cycles, just spend AP whenever you want. Chaotic and hard to adjudicate at the table.

**Solution:** Each round contains multiple cycles. Each cycle follows Declaration → Resolution → Deduction. Repeat until nobody can afford another action.

**Why:** The cycle structure gives you the best of both worlds. You commit to one action at a time (manageable decisions), but you make multiple decisions per round (tactical depth). Critically, what happens in cycle 1 informs your cycle 2 decision. If your charge in cycle 1 dropped you to 2 AP, you're making very different choices in cycle 2 than if you'd used a cheap action and had 5 AP left. This creates a natural planning horizon - do you front-load expensive actions (act powerfully now, be limited later) or conserve AP (act modestly now, have options later)?

### 5. Resolution Order (Highest AP First, Ties Simultaneous)

**Problem:** When multiple combatants act in the same cycle, who goes first? The resolution order needs to be fast to determine, create tactical implications, and handle ties elegantly.

**Alternatives considered:**

- **Lowest AP first (most committed acts first):** Thematic (the person doing the biggest action is most "invested") but counterintuitive. It rewards expensive actions with speed, removing the cost/speed tradeoff.
- **Fixed initiative order:** Roll once, keep the order all fight. Simpler but doesn't interact with the AP system at all.
- **DEX tiebreaker:** Ties broken by DEX score. Functional but makes ties less dramatic and gives permanent advantage to high-DEX characters (who already benefit from the variance roll).

**Solution:** Highest current AP resolves first. Ties resolve simultaneously.

**Why:** Highest-AP-first creates a clean, emergent initiative system. Characters with more resources to spare (because they chose cheaper actions or rolled better) act before those who are more committed. This means cheap actions are doubly valuable - they cost less AP _and_ keep you acting earlier in subsequent cycles. The simultaneous resolution of ties is where the drama lives. When two fighters both have 6 AP, they swing at the same time. Mutual kills are possible. This captures the chaos of real melee combat and creates memorable moments that strict turn order never produces.

### 6. Action Cost Tiers (1-5 AP)

**Problem:** Actions need costs that create meaningful choices. If everything costs 3 AP, there's no decision space. The cost range needs to be wide enough for differentiation but narrow enough that the math stays simple.

**Alternatives considered:**

- **Flat costs (everything 2-3 AP):** Too uniform. No reason to prefer one action over another based on efficiency.
- **Wider range (1-8 AP):** More granularity but some actions would consume an entire round, reducing the multi-cycle structure to irrelevance.
- **Variable costs (2d6 AP per action):** Adds uncertainty to action costs. Interesting but makes planning nearly impossible.

**Solution:** Five tiers from 1 to 5 AP:

- 1 AP: Reactive (Wait)
- 2 AP: Quick/minor (Quick Action, Half Move, Brace, Unarmed, Aid, Guard, Coordinated Defence, Break Free)
- 3 AP: Standard (Full Move, Melee Attack, Ranged Attack, Fighting Withdrawal, Grapple)
- 4 AP: Committed (Cast Spell, Retreat, Coordinated Attack)
- 5 AP: Major (Aimed Shot, Charge)

**Why:** Five tiers give enough spread that every cost bracket feels distinct while keeping the math trivial (all single-digit subtraction). The tiers also create natural pairings and tradeoffs: a 3 AP melee attack lets you attack twice in a round (6 AP total), but a 5 AP charge gives you a better single strike at the cost of most of your round. A 2 AP half move is more flexible than a 3 AP full move because you can pair it with more actions. These micro-decisions are where the tactical depth lives.

### 7. Wait and Interrupt System

**Problem:** Players need a way to react to enemy actions rather than always declaring proactively. Overwatch, ambush, and defensive preparation are core tactical concepts that need mechanical support.

**Alternatives considered:**

- **No reaction system:** Simpler but removes a huge category of tactical play. Archers can't hold fire, fighters can't ready attacks against approaching enemies.
- **Free reactions (like D&D 5e opportunity attacks):** Automatic reactions remove player choice and add rules exceptions.
- **Delay action (move to later in the order):** Common in other systems but doesn't interact well with AP-based resolution order.

**Solution:** Wait costs 1 AP. You can either passively wait (do nothing, keep AP) or declare a trigger condition. When the trigger fires, you interrupt the triggering action and act first, paying your reaction's AP cost.

**Why:** 1 AP is the cheapest possible action, making Wait accessible but not free. The trigger system gives players genuine tactical options - "if the orc charges, I attack" or "if anyone approaches the door, I shoot." The interrupt mechanic means the waiting character acts _before_ the trigger resolves, creating a real advantage for patience. The restriction against Waiting in melee prevents it from being an infinite stalling tactic - in close combat, you're fighting, not watching. Multiple Waits stack (1 AP each), representing sustained alertness that slowly drains your pool.

### 8. Fury Pool (Leftover AP as Shared Resource)

**Problem:** At the end of a round, characters often have 1-2 AP left - not enough for any action. These leftovers feel wasted, and "wasted resources" is an unsatisfying feeling in a resource-management system.

**Alternatives considered:**

- **AP carries over:** Leftover AP adds to next round's pool. Creates runaway advantage - characters who conserve AP get increasingly powerful rounds.
- **Individual fury/momentum:** Each character tracks their own bonus pool. More tracking per character, and it doesn't encourage teamwork.
- **No mechanic (AP just expires):** Simplest but feels bad. Players would try to spend AP exactly to zero, which creates weird action choices driven by math rather than tactics.
- **Larger contributions (add all leftover AP):** Would make the pool grow too fast and become the dominant resource rather than a supplemental one.

**Solution:** Communal Fury Pool shared by all players. At round end, each player with leftover AP may add 1 point (regardless of how much AP remains). Spend from the pool at any time for +1 damage (1 Fury), -1 incoming damage (2 Fury), or +1 AP (3 Fury). Monsters don't contribute or spend.

**Why:** The Fury Pool solves several problems at once. Leftover AP feels meaningful rather than wasted - even 1 AP remaining contributes to the team. The communal nature creates team tactics ("should we save Fury for the boss fight?") and dramatic moments ("spend our last Fury point to finish it!"). The spending options cover offense, defense, and action economy at increasing costs, so the pool is always relevant but never dominant. Making it player-only reinforces the heroic feel - the party builds momentum together that monsters can't match.

### 9. Grappling Mechanics

**Problem:** Grappling is a staple of fantasy combat (wrestlers, bar brawls, restraining enemies) but is notoriously fiddly in most RPG systems. It needs to exist without becoming a subsystem that overwhelms the core rules.

**Alternatives considered:**

- **No grappling rules:** Simplest but leaves a gap. Players will want to grab enemies eventually.
- **Complex grappling (pin/hold/throw options):** More realistic but adds a subsystem within a subsystem. Too much for a 2-page reference.
- **Grapple as a condition only:** "You're grappled, neither can move." Simple but gives no ongoing tactical choices.

**Solution:** Grapple (3 AP) initiates with opposed STR check. While grappling: no movement, unarmed attacks only, -2 AC from outside attacks. Break Free (2 AP) uses opposed STR or DEX with a free half move on success. Requires a free hand.

**Why:** The free-hand requirement creates a meaningful equipment choice - you can't grapple with a two-handed sword or while using a shield. This makes unarmed/lightly-armed characters better at grappling, which feels right. The mutual vulnerability (-2 AC from outside) makes grappling a calculated risk, not a safe lockdown. STR for initiating and STR-or-DEX for escaping means strong characters are good grapplers but quick characters can still wriggle free. The costs (3 AP to start, 2 AP to escape) mean grappling is a significant commitment within the round's action economy.

### 10. Cooperative Actions (Aid, Guard, Coordinated Attack/Defence)

**Problem:** OSE combat tends toward individual optimization - each character does their own thing independently. We wanted mechanics that reward teamwork and make party coordination feel powerful.

**Alternatives considered:**

- **No cooperative actions:** Simpler but misses an opportunity. Fantasy combat is full of "cover me!" and "together, now!" moments.
- **Complex formation rules:** Detailed positioning requirements with multiple bonuses. Too fiddly for theater-of-mind play.
- **Passive auras ("allies within 10' get +1"):** No player choice involved, just proximity bonuses.

**Solution:** Four cooperative actions at 2-4 AP each:

- **Aid (2 AP):** Give an ally +2 to hit or +2 AC. Covers feints, distractions, trips - any creative help.
- **Guard (2 AP):** Intercept attacks meant for an adjacent ally, using your AC.
- **Coordinated Defence (2 AP):** Formation bonus of +1 AC for all participants. Must maintain and move together.
- **Coordinated Attack (4 AP):** Attack the same target together for +1 to hit and +1 damage per extra attacker.

**Why:** Each cooperative action fills a different tactical niche. Aid is the versatile helper action - cheap, flexible, and narratively open (the player describes _how_ they help). Guard is the bodyguard move - the fighter protecting the wizard. Coordinated Defence rewards disciplined formations (shield wall, back-to-back). Coordinated Attack rewards focused aggression (ganging up on the big threat). The costs are calibrated so cooperation is efficient but not mandatory - you're always choosing between helping a teammate and acting independently.

### 11. Charge and Brace Tactical Triangle

**Problem:** Movement into combat should have tactical weight. Simply moving adjacent and attacking (Move + Attack) is the default, but there should be aggressive and defensive alternatives that interact with each other.

**Alternatives considered:**

- **Charge only (no counter):** Charges would dominate because there's no risk beyond the AC penalty.
- **Opportunity attacks on movement:** Common in modern D&D but adds automatic reactions that slow play and don't fit OSE's style.
- **Reach weapon advantage (attack before adjacent):** Interesting but requires positional tracking that theater-of-mind handles poorly.

**Solution:** A tactical triangle:

- **Charge (5 AP):** Full move + attack, +2 to hit, -2 AC until next turn.
- **Brace (2 AP):** Ready against charge; free attack if charged (requires spear/polearm).
- Standard attack beats Brace (wasted AP if nobody charges).

**Why:** The triangle creates a rock-paper-scissors dynamic. Charging is powerful but risky - if the defender braced, you eat a free attack on the way in. Bracing is cheap but only pays off against charges - if the enemy just walks up and attacks normally, you wasted 2 AP. Standard attacks are reliable but don't get the charge's +2 to hit. This gives players (and GMs) a genuine read-the-opponent decision: "Will they charge? Should I brace? Or just attack?" The Brace requirement for spears/polearms also gives those weapons a unique tactical role beyond just damage dice.

### 12. Spell Casting at 4 AP with No Per-Round Cap

**Problem:** Magic in OSE is already limited by spell slots. Adding heavy AP costs or per-round restrictions could make casters feel doubly punished. But spells need to cost enough that casting isn't trivially fast.

**Alternatives considered:**

- **3 AP (same as attacks):** Makes spells too easy to chain. A caster with 7 AP could cast twice (6 AP) and still have 1 AP left.
- **5 AP:** Too expensive. Casters would cast once per round and have almost nothing left, making them feel worse than fighters.
- **One spell per round hard cap:** Artificial restriction that doesn't interact with the AP system. If AP is the resource, let AP be the constraint.
- **Variable cost by spell level:** More realistic but adds a lookup table and complexity.

**Solution:** All spells cost 4 AP. No per-round limit on casting.

**Why:** 4 AP is the committed tier - casting a spell eats more than half your base AP on a standard roll. With 7 AP, you can cast once and have 3 AP left for movement or a quick action. You _could_ cast twice (8 AP), but only on a high variance roll, and it would consume your entire round. This creates a natural throttle without artificial caps. OSE already limits casters through spell slots - if a magic-user wants to burn through their daily allotment in two rounds of frantic casting, that's a dramatic tactical choice with real consequences, not something the system should prevent.

### 13. Two-Handed Weapons at 4 AP

**Problem:** Two-handed weapons deal more damage (1d10 vs 1d8 or 1d6) but need a drawback beyond "can't use a shield." In standard OSE, they already act last. Our system needs an equivalent.

**Alternatives considered:**

- **Same cost as one-handed (3 AP):** No drawback for the extra damage. Two-handed weapons would dominate.
- **5 AP:** Too expensive. A two-handed weapon user could barely act once per round (7 - 5 = 2 AP remaining, not enough for another attack).
- **Bonus damage at 3 AP but some other penalty:** Harder to adjudicate and remember.

**Solution:** Two-handed melee weapons cost 4 AP instead of 3 AP.

**Why:** The +1 AP cost is elegant. It mirrors the "act last" rule from OSE (the attack resolves later because you have less AP remaining after paying 4 instead of 3). It also creates a concrete tradeoff: a sword-and-shield fighter can attack twice (3 + 3 = 6 AP), but a greatsword fighter attacking twice needs 8 AP (only possible on the best variance roll). Most rounds, the greatsword fighter gets one powerful attack while the sword fighter gets two moderate ones. This is the speed-vs-power tradeoff that makes weapon choice meaningful. It also interacts with the Brace/Charge dynamic - the Temple Guardians in the reference example couldn't attack with their halberds at 3 AP because the cost was 4 AP.

### 14. Surprise Rules (Half AP, No Variance)

**Problem:** Surprise in OSE gives one side a free round. We need an equivalent that works with AP instead of full-round advantage.

**Alternatives considered:**

- **Full round of free actions:** Too powerful in an AP system. An unsurprised party could obliterate surprised enemies with multiple cycles of unopposed actions.
- **-2 AP penalty:** Small enough to feel insignificant, especially against the variance roll.
- **No AP (skip first round):** Too harsh. Surprised characters would be helpless while potentially taking multiple attacks.
- **Normal AP but act last:** Doesn't meaningfully capture the disorientation of surprise.

**Solution:** Surprised combatants get half base AP rounded down (players: 3 AP, monsters: 3 AP). No variance roll - the fixed half-pool represents being caught flat-footed.

**Why:** 3 AP is enough for exactly one standard action (move, attack, or cast a spell, but not two of those). This means surprised combatants aren't helpless - they can react - but they're severely limited compared to the unsurprised side's full 7 or 8 AP. No variance roll makes surprise deterministic: you're caught off-guard, there's no lucky roll to offset it. The fixed 3 AP also means surprised monsters (base 6) and surprised players (base 7) both end up at 3 AP - surprise is the great equalizer.

### 15. Terminology Choices (Round/Cycle/Action, Dropping "Turn")

**Problem:** RPG terminology is overloaded. "Turn" means different things in different games (and even within OSE, where a "turn" is 10 minutes for exploration but an action in combat). Clear, unambiguous terms are essential for a reference document.

**Alternatives considered:**

- **Keep "Turn":** Familiar but ambiguous. "Your turn" vs "a turn of exploration" creates confusion.
- **"Phase" for cycles:** Clashes with OSE's existing combat phases (movement phase, missile phase, etc.).
- **"Tick" or "Beat" for cycles:** Flavor terms that might confuse players looking for a mechanical label.

**Solution:** Three terms with clear scope:

- **Round:** Full AP refresh to next AP refresh. The big container.
- **Cycle:** One Declaration → Resolution → Deduction sequence. The repeated unit within a round.
- **Action:** What you do (Move, Attack, Cast Spell, etc.). The atomic choice.

"Turn" is dropped entirely from combat terminology.

**Why:** Each term describes exactly one level of the combat structure with no overlap. "Round" and "Action" are already familiar to most RPG players. "Cycle" is the only new concept, and it maps intuitively to "one loop through the declare-resolve-deduct process." Dropping "Turn" eliminates the most common source of table confusion and forces clear communication: "next round" (AP refresh), "next cycle" (next declaration phase), "your action" (what you do).

---

## What Was Kept from OSE

The system deliberately preserves these core mechanics unchanged:

- **Attack rolls** (d20 vs AC target number, THAC0 or ascending AC)
- **Armor Class** (all values, armor types, and shield bonuses work as written)
- **Hit Points and damage** (all damage dice, healing, and death rules unchanged)
- **Saving throws** (all five categories and their uses)
- **Spell mechanics** (memorization, casting, effects, durations)
- **Monster stat blocks** (HD, AC, damage, special abilities - only initiative/reaction replaces with AP)
- **Class features** (thief skills, cleric turning, fighter combat options per OSE rules)
- **Equipment and encumbrance** (if used)

The goal was surgical replacement: swap out initiative and action economy, leave everything else untouched. A GM can adopt this system mid-campaign without converting any existing content.

---

## Ideas Considered and Deferred

These concepts were discussed during design but deliberately left for future versions:

- **Weapon reach mechanics:** Spears and polearms having tactical advantages beyond Brace (attacking from further away, defensive bonuses, cost modifications). Flagged as Phase 2 exploration. The current Brace mechanic gives reach weapons a role without needing a full reach subsystem.

- **Advanced modifiers:** Quick Actions (reduced AP cost with penalty), Prepared Actions (extra AP for bonus), and expanded Aimed Attacks. Flagged as Phase 3 optional complexity. The base system intentionally avoids modifier stacking.

- **Larger AP variance:** Using 1d8 or 1d10 for variance, or a 2d6 bell curve. The current 1d6 with +/-1 was chosen for its tight, predictable range. A wider variance might suit a grittier game.

---

## Future Directions

These ideas are captured in the project backlog for potential v1.1 development:

- **Monster AP scaling by HD** - Guidance for varying monster AP beyond the flat 6 AP base. Higher-HD monsters might warrant 7-8 AP to represent supernatural speed or combat experience.

- **Multi-attack rules** - Monsters with multiple attack routines (Claw/Claw/Bite) need a framework for how those interact with the AP cycle system. Each attack as a separate AP spend? Bundled attack routine at a higher cost?

- **Haste effects** - Spells and potions that grant extra attacks in standard OSE need translation into the AP framework. Bonus AP? Reduced action costs? A separate extra action?

---

_Design companion for [tactical-initiative-reference-v1.0.md](tactical-initiative-reference-v1.0.md). Compatible with Old School Essentials._
