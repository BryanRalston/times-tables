import { describe, expect, it } from "vitest";
import { backupQrSvg, exportBackup, importBackup } from "./backup";
import { blankChild, freshSave, parseSave } from "./storage";
import type { Save } from "./model";

function family(): Save {
  const first = blankChild({ id: "maya", name: "Maya", grade: "2", avatarId: "frog" });
  first.stars = 12;
  first.streak = 4;
  first.secondsByDay = { "2026-10-05": 80, "2026-10-07": 140 };
  first.skills = { "table:7": { ok: 6, miss: 1 } };
  const second = blankChild({ id: "leo", name: "Leo", grade: "K" });
  return parseSave({
    version: 3,
    activeId: "leo",
    sound: false,
    children: [first, second],
  });
}

describe("progress backup", () => {
  it("round-trips a save through a code and a QR", async () => {
    const save = family();
    const code = await exportBackup(save);
    expect(code.startsWith("SA1.") || code.startsWith("SA0.")).toBe(true);
    const back = await importBackup(code);
    expect(back).toEqual(save);
    const spaced = code.replace(/(.{12})/g, "$1\n");
    expect(await importBackup(spaced)).toEqual(save);
    const svg = await backupQrSvg(code);
    expect(svg).toContain("<svg");
    expect(svg).not.toContain("<?xml");
  });

  it("rejects a code that is not a backup", async () => {
    expect(await importBackup("")).toBeNull();
    expect(await importBackup("hello")).toBeNull();
    expect(await importBackup("SA1.not-valid")).toBeNull();
    const fresh = freshSave();
    expect(await importBackup(await exportBackup(fresh))).toEqual(parseSave(fresh));
  });
});
