import OBR from "@owlbear-rodeo/sdk";
import { EXTENSION_ID, MONSTER_BASE_AP } from "./util/constants";
import { METADATA_KEY } from "./types";
import type { CombatState, Combatant } from "./types";
import { generateId } from "./util/ids";

OBR.onReady(() => {
  setupContextMenu();
});

function setupContextMenu(): void {
  OBR.contextMenu.create({
    id: `${EXTENSION_ID}/add-to-combat`,
    icons: [
      {
        icon: "/icon.svg",
        label: "Add to Combat",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    async onClick(context) {
      const role = await OBR.player.getRole();
      if (role !== "GM") {
        OBR.notification.show("Only the GM can add tokens to combat");
        return;
      }

      const metadata = await OBR.room.getMetadata();
      const state = metadata[METADATA_KEY] as CombatState | undefined;

      if (!state || state.phase !== "setup") {
        OBR.notification.show("Can only add tokens during setup phase");
        return;
      }

      const newCombatants: Combatant[] = [];
      for (const item of context.items) {
        // Skip if already imported
        if (state.combatants.some((c) => c.tokenId === item.id)) {
          continue;
        }

        newCombatants.push({
          id: generateId(),
          name: item.name || "Unknown",
          side: "monster",
          status: "active",
          stats: { hpCurrent: 8, hpMax: 8, ac: 7, thac0: 17 },
          dexCategory: "standard",
          apBase: MONSTER_BASE_AP,
          apVariance: false,
          surprised: false,
          tokenId: item.id,
        });
      }

      if (newCombatants.length === 0) {
        OBR.notification.show("Selected tokens are already in combat");
        return;
      }

      const updated: CombatState = {
        ...state,
        combatants: [...state.combatants, ...newCombatants],
      };

      await OBR.room.setMetadata({ [METADATA_KEY]: updated });
      OBR.notification.show(
        `Added ${newCombatants.length} combatant${newCombatants.length !== 1 ? "s" : ""}`,
      );
    },
  });
}
