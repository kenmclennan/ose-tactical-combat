# OSE Tactical Initiative System

_Version 1.1_

## Overview

This system replaces Old School Essentials' standard initiative rules with an Action Point (AP) system inspired by RuneQuest and Mythras. It adds tactical depth to combat while preserving everything else you love about OSE.

**What Changes:**

- Initiative is replaced by Action Points
- Each round, characters spend AP to take actions
- Higher AP means acting first; ties resolve simultaneously
- Multiple actions per round are possible

**What Stays the Same:**

- Attack rolls, Armor Class, and damage
- Hit Points, saving throws, and death
- Spells, abilities, and class features
- Monster stats (except AP replaces initiative)

**Why Use This System:**

- **Tactical choices matter** - When you act depends on what you do and how much AP you have left
- **Simultaneous combat** - Ties create dramatic mutual strikes and the real risk of trading blows
- **Team tactics** - Cooperative actions reward coordination (Aid, Guard, Coordinated Attack/Defence)
- **Resource management** - Balancing speed vs power creates meaningful decisions each round
- **Fury Pool** - Leftover AP becomes a shared resource for clutch moments
- **Simple tracking** - Just one number per combatant (current AP)

---

## Quick Reference

## Action Points (AP)

**Base AP per Round:**

- Players: 7 AP
- Monsters: 6 AP (may vary by creature)

**Roll for AP (1d6 at start of each round):**

| Roll | DEX 3-8 | DEX 9-12 | DEX 13-18 |
| :--: | :-----: | :------: | :-------: |
|  1   |  6 AP   |   6 AP   |   6 AP    |
|  2   |  6 AP   |   7 AP   |   7 AP    |
| 3-4  |  7 AP   |   7 AP   |   7 AP    |
|  5   |  7 AP   |   7 AP   |   8 AP    |
|  6   |  8 AP   |   8 AP   |   8 AP    |

---

## Round & Cycle Structure

**Round** = AP refresh to next AP refresh. Contains multiple cycles.

**Each Cycle:**

1. **Declaration** - All combatants declare ONE action (note cost, don't deduct yet).
2. **Resolution** - Actions resolve in order of **highest current AP to lowest**. Ties resolve simultaneously (opposed DEX check for movement conflicts).
3. **Deduct** - Subtract AP costs from each participant's pool.

Repeat cycles until no one has enough AP to act, then start a new round.

_Your AP determines when you act. Your action choice determines what you have left._

_Unspent AP does not carry over - but leftover AP banks Fury (1 per 1 leftover AP, max 3 per player per round)._

**Surprise:** Surprised combatants get half base AP (no variance roll). Players: 3 AP. Monsters: 3 AP.

---

## Actions

| AP  | Action              | Effect                                                                     |
| :-: | ------------------- | -------------------------------------------------------------------------- |
|  1  | Wait                | Hold or set trigger to interrupt (not in melee)                            |
|  2  | Quick Action        | Draw/drop weapon, take cover, stand up, open door                          |
|  2  | Move (Half)         | Half encounter move (max 2 per round)                                      |
|  2  | Brace               | Ready vs charge; free attack if charged (spear/polearm)                    |
|  2  | Unarmed Attack      | 1d2+STR damage                                                             |
|  2  | Aid                 | Ally gets +2 to next attack OR +2 AC until your next turn                  |
|  2  | Guard               | Take attacks meant for adjacent ally (use your AC)                         |
|  2  | Coordinated Defence | All in formation get +1 AC; pay each round; move together                  |
|  2  | Break Free          | Escape grapple (STR vs STR or DEX); includes half move                     |
|  3  | Move (Full)         | Full encounter move                                                        |
|  3  | Attack              | Strike foe; melee or ranged                                                |
|  3  | Action              | Non-combat activity (drink potion, use item, etc.)                         |
|  3  | Fighting Withdrawal | Half move backward, no AC penalty                                          |
|  3  | Grapple             | Opposed STR; win = grapple, lose = action wasted                           |
|  4  | Two-Handed Attack   | Strike with two-handed weapon                                              |
|  4  | Cast Spell          | Cast a prepared spell                                                      |
|  4  | Retreat             | Full move backward, foes get +2 to hit you                                 |
|  4  | Coordinated Attack  | Attack with allies vs same target; +1 to hit, +1 damage per extra attacker |
|  5  | Aimed Shot          | Ranged attack with +2 to hit                                               |
|  5  | Charge              | Full move + attack, +2 to hit, -2 AC until next turn                       |
|  6  | Slow Action         | Complex non-combat activity (barricade door, bind wounds)                  |

**Grappling:** Requires a free hand (no two-handed weapons or sword-and-shield). While grappling, neither can move or attack others. Unarmed attacks only. Both at -2 AC from outside attacks.

**Wait & Interrupt:** Declare a trigger (e.g., "if the orc charges, I attack"). When triggered, you interrupt and act first, then pay your action's AP cost. Must have enough AP remaining. Cannot Wait while in melee.

**Monster Opposed Checks:** Monsters use HD as their modifier (d20+HD) for grapple, break free, and movement contests.

---

## Fury Pool

Communal pool shared by all players (monsters do not contribute or spend). At round end, each player banks 1 Fury per 1 leftover AP (max 3 per player per round). Spend at any time:

| Cost | Effect                           |
| :--: | -------------------------------- |
|  1   | +1 damage to a successful attack |
|  2   | -1 damage from incoming attack   |
|  3   | +1 AP to your current pool       |

---

## Example of Play

_Sarah plays **Kael Ironhand**, a fighter with sword and shield (AC 4, STR +1). Marcus plays **Zara the Unseen**, a magic-user (AC 8, DEX bonus). They face two **Temple Guardians** - 4 HD undead warriors wielding ceremonial halberds (two-handed)._

---

**The Scene:** The Sunken Temple of Koth-Azur. Phosphorescent fungi cast sickly green light across broken pillars and a cracked obsidian floor. The adventurers stand at the chamber's entrance. Forty feet away, flanking a sealed bronze door, two skeletal warriors in corroded ceremonial armor raise their halberds, eye sockets blazing with violet fire.

**GM:** "The Guardians step forward, halberds leveled. Roll for AP - new round."

Sarah rolls a 5 for Kael. With no DEX modifier: **7 AP**.
Marcus rolls a 6 for Zara. With DEX bonus: **8 AP**.
The Guardians have fixed **6 AP** each.

---

### Round 1, Cycle 1

**GM:** "Declare actions."

**Sarah:** "Kael charges the nearest Guardian!" (Charge - 5 AP)

**Marcus:** "Zara holds back - she Waits, trigger: if a Guardian attacks Kael, she casts _Magic Missile_." (Wait - 1 AP)

**GM:** "Guardian A advances on Kael with halberd raised. Guardian B moves to flank." (Both Full Move - 3 AP)

**Resolution order:** Zara (8 AP), Kael (7 AP), then both Guardians (6 AP).

Zara's Wait doesn't trigger yet - no attack declared. Kael's charge carries him across the cracked floor, slamming into Guardian A. He rolls 15 + 1 STR = 16, hitting AC 5. The Guardian is AC 5 - hit! Kael rolls 7 damage. Bones splinter as his blade bites deep. The Guardians complete their movement, flanking positions around Kael.

**Deduct AP:** Kael 7→2, Zara 8→7, Guardian A 6→3, Guardian B 6→3.

_Kael is now -2 AC from his Charge until next round (currently AC 6)._

---

### Round 1, Cycle 2

**GM:** "Cycle 2. Declare."

**Sarah:** "2 AP left... Kael takes a Quick Action to position his shield against Guardian B." (Quick Action - 2 AP)

**Marcus:** "Zara still Waits with the same trigger." (Wait - 1 AP)

**GM:** "Guardian A attacks Kael with its halberd!" (Two-Handed Attack - 4 AP, but it only has 3 AP!)

**GM:** "Wait - Guardian A only has 3 AP. It can't attack with a two-handed weapon. It uses Fighting Withdrawal instead, pulling back." (Fighting Withdrawal - 3 AP)

"Guardian B attacks Kael!" (Two-Handed Attack - 4 AP, but it also only has 3 AP!)

**GM:** "Neither Guardian can attack - halberds cost 4 AP and they only have 3. Guardian A withdraws. Guardian B also withdraws, circling."

**Marcus:** "Zara's trigger never fired. She keeps the Wait and still has 6 AP."

**Resolution:** Zara (6 AP), Guardian A (3 AP), Guardian B (3 AP), Kael (2 AP).

Zara continues watching. Both Guardians withdraw half their movement, repositioning near the bronze door. Kael steadies his shield.

**Deduct AP:** Kael 2→0, Zara 6→5, Guardian A 3→0, Guardian B 3→0.

---

### End of Round 1

Kael and both Guardians have 0 AP. Zara has 5 AP remaining.

**GM:** "Zara, you have AP left. One more cycle?"

**Marcus:** "Zara steps forward and hurls a _Magic Missile_ at Guardian A!" (Full Move - 3 AP, Cast Spell - 4 AP = 7 AP total. She only has 5!)

**Marcus:** "Scratch that - Half Move toward Kael, then cast." (Half Move 2 AP + Cast Spell 4 AP = 6 AP. Still too much!)

**Marcus:** "Fine - she just casts from here." (Cast Spell - 4 AP)

**Resolution:** The silvery bolt streaks across the chamber, automatic hit. 5 damage. Guardian A's ribcage explodes. It crumbles.

**Deduct AP:** Zara 5→1.

**GM:** "Zara, you have 1 AP left. Not enough for another action."

**Marcus:** "She holds position, keeping her eyes on the remaining Guardian."

**Fury Pool:** Zara has 1 leftover AP - not enough to bank any Fury (need 2). The party has **0 Fury**.

---

### Round 2

**GM:** "New round. AP refreshes. Roll variance."

Sarah rolls a 1 for Kael. **6 AP** (bad luck!).
Marcus rolls a 3 for Zara. With DEX bonus, still just **7 AP**.
Guardian B: **6 AP**.

Kael's Charge penalty ends. He's back to AC 4.

**GM:** "One Guardian remains, backing toward the sealed door. It hisses in a long-dead language. Declare."

**Sarah:** "Kael advances and attacks!" (Full Move 3 AP + Attack 3 AP = 6 AP)

**Marcus:** "Zara uses Aid - she shouts a warning about the Guardian's halberd reach, giving Kael +2 to hit!" (Aid - 2 AP)

**GM:** "The Guardian braces its halberd against Kael's charge!" (Brace - 2 AP)

**Resolution order:** Zara (7 AP), Kael and Guardian B (both 6 AP - simultaneous!)

Zara's shout rings out: "Watch the reach, Kael!" (+2 to Kael's next attack)

Kael and the Guardian act simultaneously. But wait - the Guardian Braced, and Kael is moving in. Does this trigger?

**GM:** "Kael, you're moving in to attack - that's not a Charge action, just Full Move + Attack. The Brace only triggers on Charges. The Guardian wasted its Brace!"

Kael swings with his Aid bonus: rolls 11 + 1 STR + 2 Aid = 14, hitting AC 5. Hit! He rolls damage: 6.

Six damage total. Kael's blade catches the Guardian beneath its jaw, wrenching upward with every ounce of strength. The skull splits. It collapses in a heap of ancient bone and rusted armor.

**Deduct AP:** Kael 6→0, Zara 7→5, Guardian B destroyed.

---

**GM:** "The chamber falls silent. Violet fire fades from the Guardian's eye sockets. Before you, the sealed bronze door waits, covered in warnings written in a language that predates the kingdoms of men."

**Sarah:** "Kael wipes his blade on his cloak. 'Good call on that warning, Zara.'"

**Marcus:** "She's already studying the door. 'Save the thanks. Whatever they were guarding is still in there.'"

---

_Compatible with Old School Essentials. All other rules (attack rolls, AC, damage, saves) unchanged._
