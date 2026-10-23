// An unmounted scene's renderer must not stay reachable through what scenes share (O-030 T-153): releasing tells every renderer to forget it.
import { describe, expect, it } from "vitest";
import { Sprite } from "three";
import { releaseGlowTexture } from "../src/app/bodyDraw";
import { anchorSpriteTexture, releaseAnchorSprite } from "../src/app/TrackedBodyView";

describe("releasing what scenes share", () => {
  it("disposes the shared anchor picture and makes a new one next time", () => {
    const first = anchorSpriteTexture();
    let disposed = 0;
    first.addEventListener("dispose", () => { disposed += 1; });
    releaseAnchorSprite();
    expect(disposed).toBe(1);
    expect(anchorSpriteTexture()).not.toBe(first);
    releaseAnchorSprite();
  });

  it("disposes the one geometry every sprite shares", () => {
    const geometry = new Sprite().geometry;
    let disposed = 0;
    geometry.addEventListener("dispose", () => { disposed += 1; });
    releaseGlowTexture();
    expect(disposed).toBe(1);
  });
});
