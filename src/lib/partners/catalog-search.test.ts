import { describe, expect, it } from "vitest";
import { indexCatalog, searchCatalog } from "./catalog-search";

describe("catalog search", () => {
  it("matches accented names and preserves source order and category filtering", () => {
    const index = indexCatalog([{ name: "Pão francês", category: "bread" }, { name: "Pão integral", category: "bread" }, { name: "Pão de queijo", category: "snack" }], (item) => item.name);
    expect(searchCatalog(index, " PAO ", 6, (item) => item.category === "bread").map((item) => item.name)).toEqual(["Pão francês", "Pão integral"]);
    expect(searchCatalog(index, "inexistente", 6)).toEqual([]);
  });
  it("stops scanning after six matches instead of processing the whole catalog", () => {
    let inspected = 0;
    const index = Array.from({ length: 10000 }, (_, item) => ({ item, get searchText() { inspected++; return "supino"; } }));
    expect(searchCatalog(index, "supino", 6)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(inspected).toBe(6);
  });
  it("can request a sentinel result for pagination without dropping matches", () => {
    const index = indexCatalog(Array.from({ length: 65 }, (_, id) => ({ id, name: `Exercício ${id}` })), (item) => item.name);
    expect(searchCatalog(index, "exercicio", 31)).toHaveLength(31);
    expect(searchCatalog(index, "exercicio", 61)).toHaveLength(61);
    expect(searchCatalog(index, "exercicio", 91)).toHaveLength(65);
  });
});
