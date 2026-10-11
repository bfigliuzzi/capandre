import { screen } from "@testing-library/react";
import { openDB } from "idb";
import { describe, expect, it } from "vitest";
import { DictionaryLoader } from "@/components/dictionnaire/dictionary-loader";
import { getDB } from "@/lib/db/database";
import { offline, renderApp, serveDictionary } from "@/test/render-app";

function Ready() {
  return (
    <DictionaryLoader>
      {(dictionary) => <p>Dictionnaire prêt : {dictionary.pages.length} pages</p>}
    </DictionaryLoader>
  );
}

describe("chargement du dictionnaire (R31, R32)", () => {
  it("annonce la préparation, copie le fichier, puis affiche le dictionnaire", async () => {
    const fetchSpy = serveDictionary();
    const { unmount } = renderApp(<Ready />);

    expect(screen.getByRole("status")).toHaveTextContent("Préparation du dictionnaire…");
    expect(await screen.findByText("Dictionnaire prêt : 9 pages")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    unmount();
    renderApp(<Ready />);
    expect(await screen.findByText("Dictionnaire prêt : 9 pages")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("explique qu'il faut être connecté une fois quand le réseau manque à la première ouverture", async () => {
    offline();
    renderApp(<Ready />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/connecté à internet une première fois/);
  });

  it("refuse un fichier mal formé sans rien copier", async () => {
    serveDictionary({ version: 1, pages: "pas des pages" });
    renderApp(<Ready />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/n'a pas pu être préparé/);
    expect(await (await getDB()).count("dictionaryPages")).toBe(0);
  });

  it("migre une base v4 sans toucher aux dictées existantes", async () => {
    const v4 = await openDB("capandre", 4, {
      upgrade(db) {
        db.createObjectStore("modules", { keyPath: "id" });
        db.createObjectStore("levels", { keyPath: "id" }).createIndex("by-module", "moduleId");
        db.createObjectStore("dictations", { keyPath: "id" }).createIndex("by-module", "moduleId");
        db.createObjectStore("poems", { keyPath: "id" }).createIndex("by-module", "moduleId");
        db.createObjectStore("settings", { keyPath: "id" });
      },
    });
    await v4.put("dictations", { id: "d1", moduleId: "mod-dictation", title: "Les animaux", mode: "words", words: [], createdAt: "2026-01-01" });
    v4.close();

    serveDictionary();
    renderApp(<Ready />);

    expect(await screen.findByText("Dictionnaire prêt : 9 pages")).toBeInTheDocument();
    const db = await getDB();
    expect((await db.get("dictations", "d1"))?.title).toBe("Les animaux");
    expect(await db.get("modules", "mod-dictionary")).toMatchObject({ type: "dictionary" });
  });
});
