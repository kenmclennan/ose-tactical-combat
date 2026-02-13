/**
 * Generate the next copy name for a combatant, auto-incrementing the number suffix.
 * E.g., "Goblin" -> "Goblin 2", "Goblin 3" -> "Goblin 4"
 */
export function getNextCopyName(baseName: string, existingNames: string[]): string {
  // Strip trailing " N" suffix to get base
  const base = baseName.replace(/ \d+$/, "");

  // Find highest N among existing names matching "base" or "base N"
  const pattern = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: (\\d+))?$`);
  let highest = 0;
  for (const name of existingNames) {
    const match = name.match(pattern);
    if (match) {
      const n = match[1] ? parseInt(match[1]) : 1;
      if (n > highest) highest = n;
    }
  }

  return `${base} ${highest + 1}`;
}
