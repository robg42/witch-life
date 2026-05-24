import { describe, expect, it } from "vitest";
import {
  FEATURES,
  FEATURE_LIST,
  isFeatureKey,
  featureDefinition,
} from "@/lib/features";
import { isHardcodedAdminEmail } from "@/lib/admin";

describe("Feature registry", () => {
  it("ships the expected feature keys", () => {
    expect(Object.keys(FEATURES).sort()).toEqual(
      [
        "daily-email",
        "journal-export",
        "shared-spreads",
        "sky-alerts",
        "streaks",
        "voice-listen",
      ].sort(),
    );
  });

  it("every feature has matching metadata", () => {
    for (const def of FEATURE_LIST) {
      expect(def.key).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(["free", "paid", "admin"]).toContain(def.tier);
      expect(typeof def.defaultEnabled).toBe("boolean");
    }
  });

  it("isFeatureKey narrows correctly", () => {
    expect(isFeatureKey("streaks")).toBe(true);
    expect(isFeatureKey("nonsense")).toBe(false);
  });

  it("featureDefinition returns the matching record", () => {
    expect(featureDefinition("streaks").name).toBe("Practice streaks");
  });
});

describe("isHardcodedAdminEmail", () => {
  it("matches mail@robgregg.com case-insensitively", () => {
    expect(isHardcodedAdminEmail("mail@robgregg.com")).toBe(true);
    expect(isHardcodedAdminEmail("MAIL@ROBGREGG.COM")).toBe(true);
    expect(isHardcodedAdminEmail("  mail@robgregg.com  ")).toBe(true);
  });

  it("rejects others", () => {
    expect(isHardcodedAdminEmail("other@robgregg.com")).toBe(false);
    expect(isHardcodedAdminEmail(null)).toBe(false);
    expect(isHardcodedAdminEmail(undefined)).toBe(false);
    expect(isHardcodedAdminEmail("")).toBe(false);
  });
});
