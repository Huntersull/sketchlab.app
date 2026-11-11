import { describe, expect, it } from "vitest";
import { skillUrl } from "../src/ui/skillUrl";

describe("skillUrl", () => {
  it("uses the private deployment, without the board payload", () => {
    expect(skillUrl("https://hestia.tail3fb0e0.ts.net:9443/?g=private-board#/board/abc"))
      .toBe("https://hestia.tail3fb0e0.ts.net:9443/skills/sketch-lab/SKILL.md");
  });

  it("follows a local development origin", () => {
    expect(skillUrl("http://localhost:5173/#/board/abc"))
      .toBe("http://localhost:5173/skills/sketch-lab/SKILL.md");
  });

  it("preserves a subdirectory deployment", () => {
    expect(skillUrl("https://example.test/sketchlab/?b=private-board"))
      .toBe("https://example.test/sketchlab/skills/sketch-lab/SKILL.md");
  });
});
