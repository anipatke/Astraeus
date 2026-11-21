// The bar's fit rule (viewer-interface note, section 4): the worked widths as named cases, plus no switch, views placed in the panel, developer tools on and off. Pure: no DOM.
import { describe, expect, it } from "vitest";
import { ENGINE_PRIORITY, buildBarItems, engineItem, storyItem, switchItem, titleItem, type BarForm, type BarItem, type Ghost } from "../src/shell/bar/barItems";
import { fitBar, type BarFit } from "../src/shell/bar/fitBar";

type Widths = Record<string, Partial<Record<BarForm, number>>>;
const icon: Ghost = { shape: "icon" };

/** Belt's Jupiter view (the note's worked cases): the title, the two tabs, two story buttons ("Gaps" is in the Jupiter view only), and the engine items. */
function belt(options: { readonly gaps: boolean; readonly developer?: boolean }) {
  const engine = [
    engineItem("picker", ENGINE_PRIORITY.picker, [{ shape: "select" }]),
    engineItem("info", ENGINE_PRIORITY.info, [icon]),
    engineItem("focus", ENGINE_PRIORITY.camera, [icon]),
    engineItem("follow", ENGINE_PRIORITY.camera, [icon]),
    engineItem("overview", ENGINE_PRIORITY.camera, [icon]),
    engineItem("scale", ENGINE_PRIORITY.scale, [{ shape: "scale" }]),
    ...(options.developer === true ? [engineItem("developer", ENGINE_PRIORITY.developer, [icon])] : []),
  ];
  const items: readonly BarItem[] = buildBarItems({
    title: titleItem("title", "The asteroid belt", "Asteroid belt"),
    switches: [switchItem("views", [{ label: "Asteroid belt", shortLabel: "Belt", active: true }, { label: "Jupiter's influence", shortLabel: "Jupiter" }])],
    story: [...(options.gaps ? [storyItem("gaps", 1, "Kirkwood gaps", "Gaps")] : []), storyItem("empty", 2, "How empty is it?", "How empty?")],
    engine,
  });
  return items;
}

const PHONE_WIDTHS: Widths = { title: { full: 150, short: 122, i: 44 }, views: { full: 289, short: 134, compact: 96 }, gaps: { full: 122, short: 56 }, empty: { full: 144, short: 100 }, menu: { full: 44 } };
const WIDE_WIDTHS: Widths = {
  title: { full: 145, short: 117, i: 36 }, views: { full: 276, short: 129, compact: 96 }, gaps: { full: 117, short: 54 }, empty: { full: 138, short: 96 },
  picker: { full: 160 }, info: { full: 36 }, focus: { full: 36 }, follow: { full: 36 }, overview: { full: 36 }, scale: { full: 146 }, developer: { full: 36 }, menu: { full: 36 },
};
const phone = (viewport: number, items: readonly BarItem[]): BarFit => fitBar({ width: viewport - 24, gap: 6, phone: true, items, widths: PHONE_WIDTHS });
const wide = (viewport: number, items: readonly BarItem[]): BarFit => fitBar({ width: viewport - 36, gap: 6, phone: false, items, widths: WIDE_WIDTHS });
const forms = (fit: BarFit, ids: readonly string[]) => ids.map((id) => `${id}:${fit.placements[id]!.place}:${fit.placements[id]!.form}`);

describe("the phone row (worked cases, Belt's Jupiter view)", () => {
  it("360: [i][Belt|Jupiter][Gaps][menu]; How empty is in the menu", () => {
    const fit = phone(360, belt({ gaps: true }));
    expect(forms(fit, ["title", "views", "gaps", "empty", "menu"])).toEqual(["title:row:i", "views:row:short", "gaps:row:short", "empty:menu:short", "menu:row:full"]);
    expect(fit.total).toBe(296);
    expect(fit.fits).toBe(true);
  });

  it("390: the short title would make 374 > 366, so the row is the same as at 360", () => {
    const fit = phone(390, belt({ gaps: true }));
    expect(forms(fit, ["title", "gaps", "empty"])).toEqual(["title:row:i", "gaps:row:short", "empty:menu:short"]);
  });

  it("430: [i][Belt|Jupiter][Gaps][How empty?][menu]; both story buttons fit, as short labels", () => {
    const fit = phone(430, belt({ gaps: true }));
    expect(forms(fit, ["title", "views", "gaps", "empty", "menu"])).toEqual(["title:row:i", "views:row:short", "gaps:row:short", "empty:row:short", "menu:row:full"]);
    expect(fit.total).toBe(402);
  });

  it("360 in the Belt view (Gaps hidden): the title gets its short form back; [Asteroid belt][Belt|Jupiter][menu]", () => {
    const fit = phone(360, belt({ gaps: false }));
    expect(forms(fit, ["title", "views", "empty", "menu"])).toEqual(["title:row:short", "views:row:short", "empty:menu:short", "menu:row:full"]);
    expect(fit.total).toBe(312);
  });

  it("the title shrinks before any story button moves (owner: Title shrinks first)", () => {
    // 440 viewport: everything fits once the title is "i"; no story button is in the menu.
    const fit = phone(440, belt({ gaps: true }));
    expect(fit.placements.title!.form).toBe("i");
    expect(fit.placements.empty!.place).toBe("row");
  });

  it("every engine item is in the menu on a phone, and the menu button is on the row", () => {
    const fit = phone(1000, belt({ gaps: true, developer: true }));
    for (const id of ["picker", "info", "focus", "follow", "overview", "scale", "developer"]) expect(fit.placements[id]!.place).toBe("menu");
    expect(fit.menuButton).toBe(true);
  });

  it("a title with no short form goes from full straight to \"i\"", () => {
    const items = buildBarItems({ title: titleItem("title", "Earth"), switches: [], story: [], engine: [engineItem("picker", 1, [icon])] });
    const fit = fitBar({ width: 100, gap: 6, phone: true, items, widths: { title: { full: 150, i: 44 }, menu: { full: 44 } } });
    expect(fit.placements.title!.form).toBe("i");
  });
});

describe("the wide bar (worked cases)", () => {
  it("1280: everything on the row, no menu button; developer tools make it 1222 and still fit", () => {
    const fit = wide(1280, belt({ gaps: true }));
    expect(fit.menuButton).toBe(false);
    expect(Object.values(fit.placements).every((p) => p.place === "row" && p.form === "full" || p.place === "menu")).toBe(true);
    expect(forms(fit, ["title", "views", "gaps", "empty", "scale"]).every((entry) => entry.endsWith(":row:full"))).toBe(true);
    const withDeveloper = wide(1280, belt({ gaps: true, developer: true }));
    expect(withDeveloper.menuButton).toBe(false);
    expect(withDeveloper.placements.developer!.place).toBe("row");
    expect(withDeveloper.total).toBe(1222);
  });

  it("768: short labels, then Overview, Follow, Focus and scale go to the menu; picker and Info stay", () => {
    const fit = wide(768, belt({ gaps: true }));
    expect(forms(fit, ["title", "views", "gaps", "empty", "picker", "info", "focus", "follow", "overview", "scale", "menu"])).toEqual([
      "title:row:full", "views:row:short", "gaps:row:short", "empty:row:short", "picker:row:full", "info:row:full", "focus:menu:full", "follow:menu:full", "overview:menu:full", "scale:menu:full", "menu:row:full",
    ]);
    expect(fit.fits).toBe(true);
  });

  it("768 with developer tools: the cog leaves first (priority 6), the rest as without", () => {
    const fit = wide(768, belt({ gaps: true, developer: true }));
    expect(fit.placements.developer!.place).toBe("menu");
    expect(fit.placements.picker!.place).toBe("row");
    expect(fit.placements.scale!.place).toBe("menu");
  });

  it("a width that is not measured yet moves nothing", () => {
    const fit = fitBar({ width: 0, gap: 0, phone: false, items: belt({ gaps: true }), widths: {} });
    expect(fit.menuButton).toBe(false);
    expect(fit.fits).toBe(true);
  });

  it("a very narrow wide bar ends with the switch as a drop-down and the story buttons in the menu", () => {
    const fit = wide(240, belt({ gaps: true }));
    expect(fit.placements.views!.form).toBe("compact");
    expect(fit.placements.gaps!.place).toBe("menu");
    expect(fit.placements.title!.form).toBe("i");
  });
});

describe("other shapes of scene", () => {
  it("no switch: the title and the menu only on a phone", () => {
    const items = buildBarItems({ title: titleItem("title", "Earth"), switches: [], story: [], engine: [engineItem("picker", 1, [icon])] });
    const fit = fitBar({ width: 336, gap: 6, phone: true, items, widths: { title: { full: 60, i: 44 }, menu: { full: 44 } } });
    expect(forms(fit, ["title", "picker", "menu"])).toEqual(["title:row:full", "picker:menu:full", "menu:row:full"]);
  });

  it("views placed in the panel: no switch item, so the row holds only the title and the menu button", () => {
    const items = buildBarItems({ title: titleItem("title", "Earth"), switches: [], story: [], engine: [engineItem("display", ENGINE_PRIORITY.display, [icon])] });
    expect(items.map((item) => item.id)).toEqual(["title", "display", "menu"]);
    const fit = fitBar({ width: 336, gap: 6, phone: true, items, widths: {} });
    expect(fit.placements.display!.place).toBe("menu");
  });

  it("an item order change needs no change to the rule: a new engine item with its priority moves in order", () => {
    const items = buildBarItems({ switches: [], story: [], engine: [engineItem("a", 1, [icon]), engineItem("b", 5, [icon]), engineItem("c", 2, [icon]), engineItem("d", 2, [icon])] });
    const fit = fitBar({ width: 130, gap: 6, phone: false, items, widths: { a: { full: 36 }, b: { full: 36 }, c: { full: 36 }, d: { full: 36 }, menu: { full: 36 } } });
    // The highest number leaves first (b), then the later of two equals (d).
    expect(forms(fit, ["a", "b", "c", "d"])).toEqual(["a:row:full", "b:menu:full", "c:row:full", "d:menu:full"]);
  });

  it("no menu button when nothing is in the menu", () => {
    const items = buildBarItems({ switches: [], story: [], engine: [] });
    expect(fitBar({ width: 100, gap: 6, phone: false, items, widths: {} }).menuButton).toBe(false);
  });
});
