import { openDB } from "idb";
import { describe, expect, it } from "vitest";

// Garantit que chaque test d'écran part d'une base IndexedDB vide.
describe("outillage des tests d'écran", () => {
  it("fournit une base IndexedDB en mémoire", async () => {
    const db = await openDB("essai", 1, {
      upgrade: (d) => d.createObjectStore("cles"),
    });
    await db.put("cles", "valeur", "cle");

    expect(await db.get("cles", "cle")).toBe("valeur");
    db.close();
  });

  it("repart d'une base vide à chaque test", async () => {
    const db = await openDB("essai", 1, {
      upgrade: (d) => d.createObjectStore("cles"),
    });

    expect(await db.get("cles", "cle")).toBeUndefined();
    db.close();
  });
});
