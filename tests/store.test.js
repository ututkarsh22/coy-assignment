import { describe, it, expect, beforeEach } from "vitest";
import os from "os";
import path from "path";
import { resetDb, getFeed, swipe, getMatches, seedData } from "../lib/store";

const file = path.join(os.tmpdir(), "coy-test-db.json");
const liker = () => seedData().likedMe[0];
const nonLiker = () => { const s = seedData(); return s.profiles.find((p) => !s.likedMe.includes(p.id)).id; };

beforeEach(() => resetDb(file));

describe("swipe", () => {
  it("like on a non-liker gives no match", () => expect(swipe(nonLiker(), "like", file)).toEqual({ matched: false }));
  it("like on a liker creates a match", () => {
    const r = swipe(liker(), "like", file);
    expect(r.matched).toBe(true);
    expect(getMatches(file).map((p) => p.id)).toEqual([liker()]);
  });
  it("pass on a liker is indistinguishable from pass on a non-liker", () => {
    expect(swipe(liker(), "pass", file)).toEqual(swipe(nonLiker(), "pass", file));
    expect(getMatches(file)).toHaveLength(0);
  });
  it("rejects duplicate swipes", () => {
    swipe("p2", "pass", file);
    expect(() => swipe("p2", "like", file)).toThrow("Already swiped");
  });
  it("rejects bad input", () => {
    expect(() => swipe("p2", "maybe", file)).toThrow();
    expect(() => swipe("nope", "like", file)).toThrow("Unknown profile");
  });
});

describe("feed", () => {
  it("excludes swiped profiles", () => {
    swipe("p2", "pass", file);
    expect(getFeed(file).find((p) => p.id === "p2")).toBeUndefined();
    expect(getFeed(file)).toHaveLength(29);
  });
  it("never exposes liker info", () => {
    expect(JSON.stringify(getFeed(file))).not.toMatch(/liked/i);
  });
});
