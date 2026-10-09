import { describe, expect, it } from "vitest";
import { pickLocalVoice, type VoiceLike } from "./voice";

describe("offline voices", () => {
  it("prefers an English voice that is installed on the device", () => {
    const voices: VoiceLike[] = [
      { lang: "en-US", localService: false, name: "Network" },
      { lang: "es-ES", localService: true, name: "Local Spanish" },
      { lang: "en-GB", localService: true, name: "Local English" },
    ];
    expect(pickLocalVoice(voices)?.name).toBe("Local English");
  });

  it("uses any installed voice before a network voice", () => {
    const voices: VoiceLike[] = [
      { lang: "en-US", localService: false, name: "Network" },
      { lang: "es-MX", localService: true, name: "Local Spanish" },
    ];
    expect(pickLocalVoice(voices)?.name).toBe("Local Spanish");
  });

  it("falls back to an English network voice when nothing is installed", () => {
    expect(pickLocalVoice([{ lang: "en-US", localService: false, name: "Network" }])?.name).toBe("Network");
    expect(pickLocalVoice([])).toBeNull();
  });
});
