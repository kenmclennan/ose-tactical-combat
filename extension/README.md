# OSE Tactical Initiative - Owlbear Rodeo Extension

An AP-based tactical initiative tracker for Old School Essentials, implementing the OSE Tactical Initiative System v1.1 as an Owlbear Rodeo extension.

## Features

- **Setup Phase**: Add combatants (players and monsters) manually or from map tokens
- **Round Start**: Roll AP variance using the DEX category table
- **Declaration Phase**: Secret simultaneous action selection with lock-in mechanism
- **Resolution Phase**: Step-through combat with sorted action order
- **Cycle Management**: Automatic cycle repetition and round end detection
- **Fury Pool**: Shared resource banking (1 per 2 leftover AP) and spending
- **Dice Integration**: Built-in d6 roller with Owlbear Dice extension detection
- **Role-based UI**: GM sees everything, players see only their declarations

## Installation

1. In Owlbear Rodeo, click Extensions → Add Custom Extension
2. Enter the URL: `https://kenmclennan.github.io/ose-tactical-combat/`
3. Grant permissions

## Development

### Local Development

```bash
cd extension
npm install
npm run dev
```

Then in Owlbear Rodeo, add the custom extension with URL `http://localhost:5173`

### Building for Production

```bash
cd extension
npm run build
```

Output is in `dist/`, deployed via GitHub Pages.

## Combat Flow

### 1. Setup
- GM adds combatants and configures their stats
- Can import from map tokens via context menu
- Players can edit their own character stats
- GM clicks "Start Combat"

### 2. Round Start
- GM rolls AP variance for each combatant
- Roll uses d6 + DEX category table from TACS v1.1
- Surprise combatants get half AP (no variance)

### 3. Declaration
- All combatants declare one action (pick from 21 options)
- Players can only see their own declarations
- Lock-in: players submit declarations (GM can unlock)
- GM declares for monsters one at a time

### 4. Resolution
- Actions resolve in order of highest current AP first
- GM steps through with "Next" button
- All declarations fully visible during resolution
- Dead/incapacitated combatants auto-skip

### 5. Cycle/Round End
- AP costs deducted
- If anyone has AP >= 1: new declaration cycle
- If no one can act: round ends
- Fury banked (1 per 2 leftover AP)
- Next round or end combat

## Action List (21 actions)

| AP | Actions |
|----|---------|
| 1 | Wait |
| 2 | Quick Action, Move (Half), Brace, Unarmed Attack, Aid, Guard, Coordinated Defence, Break Free |
| 3 | Move (Full), Attack, Action, Fighting Withdrawal, Grapple |
| 4 | Two-Handed Attack, Cast Spell, Retreat, Coordinated Attack |
| 5 | Aimed Shot, Charge |
| 6 | Slow Action |

See [TACS v1.1 Reference](../tactical-initiative-reference-v1.1.md) for full rules.

## Architecture

- **State**: All combat state in OBR room metadata (syncs to all clients)
- **Rendering**: Phase-based UI (setup, round-start, declaration, resolution, round-end)
- **Rules**: Standalone rules engine (AP calculation, action costs, resolution ordering)
- **Secrecy**: UI-level filtering (data is shared, rendering hides per role/phase)

## Technical Details

- Built with vanilla TypeScript + Vite
- Uses OBR SDK v3.1.0
- CSS variables for dark/light theme support
- ~24kB gzipped
- Zero external dependencies (besides OBR SDK and Vite)

## Future Work (TACS-006: Polish)

- OBR notifications for phase changes
- AP bar animations
- Player disconnect handling
- Status changes mid-combat (HP tracking)
- Error recovery
- Combat summary screen

## References

- [OSE Tactical Initiative v1.1](../tactical-initiative-reference-v1.1.md)
- [Owlbear Rodeo SDK Docs](https://docs.owlbear.rodeo/)
