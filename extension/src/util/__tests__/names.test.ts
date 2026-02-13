import { describe, it, expect } from "vitest";
import { getNextCopyName } from "../names";

describe("getNextCopyName", () => {
  it("returns base 2 when only the base name exists", () => {
    expect(getNextCopyName("Goblin", ["Goblin"])).toBe("Goblin 2");
  });

  it("increments from the highest existing number", () => {
    expect(getNextCopyName("Goblin", ["Goblin", "Goblin 2", "Goblin 3"])).toBe("Goblin 4");
  });

  it("strips trailing number from source name before finding base", () => {
    expect(getNextCopyName("Goblin 3", ["Goblin", "Goblin 2", "Goblin 3"])).toBe("Goblin 4");
  });

  it("uses highest number even when there are gaps", () => {
    expect(getNextCopyName("Goblin", ["Goblin", "Goblin 3"])).toBe("Goblin 4");
  });

  it("returns base 1 when no existing names match", () => {
    expect(getNextCopyName("Goblin", ["Orc", "Skeleton"])).toBe("Goblin 1");
  });

  it("handles names with regex special characters", () => {
    expect(getNextCopyName("Goblin (Elite)", ["Goblin (Elite)"])).toBe("Goblin (Elite) 2");
  });

  it("does not match partial name prefixes", () => {
    expect(getNextCopyName("Goblin", ["Goblin King", "Goblin"])).toBe("Goblin 2");
  });

  it("returns base 1 when source has no existing matches", () => {
    expect(getNextCopyName("Dragon", [])).toBe("Dragon 1");
  });
});
