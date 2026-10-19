import { useId, useState } from "react";
import { Collapsible } from "./Collapsible";
import { moonCountText, searchMoons, splitNamed, type MoonFamilyList, type MoonFamilyListing, type MoonListing } from "./moonFamilies";

interface Props {
  readonly list: MoonFamilyList;
  /** The family lit up in the scene now, or null. */
  readonly highlightedFamily: string | null;
  readonly onHighlight: (familyId: string | null) => void;
  /** A moon was chosen: the shell focuses it and opens its information. */
  readonly onSelectMoon: (moonId: string) => void;
}

/**
 * A planet's moons by family (O-025 Decision 6). The featured family (the big four) sits at the top with pictures; every other family is a
 * folding section with a plain line and a count, named moons first and provisional designations folded into "+N unnamed". Opening a family
 * lights it up in the scene, closing it (or opening another) clears or moves the light. The search box lists matches across all families.
 */
export function MoonFamilyPanel({ list, highlightedFamily, onHighlight, onSelectMoon }: Props) {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const searching = query.trim() !== "";
  const matches = searchMoons(list, query);
  const moonButton = (moon: MoonListing, detail?: string) => (
    <li key={moon.id}>
      <button type="button" className="ui-row moon-row" data-moon={moon.id} data-closes-drawer="" onClick={() => onSelectMoon(moon.id)}>
        <span>{moon.label}</span>
        {detail !== undefined && <span className="moon-row-detail">{detail}</span>}
      </button>
    </li>
  );
  const toggleLight = (family: MoonFamilyListing, open: boolean) => {
    if (open) onHighlight(family.id);
    else if (highlightedFamily === family.id) onHighlight(null);
  };
  const featured = list.families.find((family) => family.id === list.featuredFamilyId);
  const folded = list.families.filter((family) => family !== featured);
  return (
    <section className="moon-panel" aria-label={`${list.planetLabel}'s moons`} data-highlight={highlightedFamily ?? ""}>
      <label className="moon-search" htmlFor={searchId}>
        <span className="moon-search-label">Find a moon</span>
        <input id={searchId} type="search" className="moon-search-input" value={query} placeholder="Name or designation" autoComplete="off" spellCheck={false} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {searching && (
        <div className="moon-results" role="group" aria-label="Search results" aria-live="polite">
          {matches.length === 0 ? <p className="moon-note">No moon matches &ldquo;{query.trim()}&rdquo;.</p> : (
            <ul className="moon-list">{matches.map(({ moon, familyLabel }) => moonButton(moon, familyLabel))}</ul>
          )}
        </div>
      )}
      <div className="moon-families" hidden={searching}>
          {featured !== undefined && (
            <div className="moon-featured" data-moon-family={featured.id} data-lit={highlightedFamily === featured.id}>
              <h3 className="moon-featured-heading">
                <button type="button" className="ui-row" aria-pressed={highlightedFamily === featured.id} data-moon-light={featured.id} onClick={() => onHighlight(highlightedFamily === featured.id ? null : featured.id)}>
                  <span>{featured.label}</span>
                  <span className="moon-count">{moonCountText(featured.moons.length)}</span>
                </button>
              </h3>
              <p className="moon-note">{featured.description}</p>
              <ul className="moon-pictures">
                {featured.moons.map((moon) => (
                  <li key={moon.id}>
                    <button type="button" className="ui-row moon-picture" data-moon={moon.id} data-closes-drawer="" onClick={() => onSelectMoon(moon.id)}>
                      {moon.pictureUrl !== undefined && <span className="moon-disc" style={{ backgroundImage: `url(${moon.pictureUrl})` }} aria-hidden="true" />}
                      <span>{moon.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {folded.map((family) => {
            const { named, unnamed } = splitNamed(family.moons);
            return (
              <div key={family.id} className="moon-family" data-moon-family={family.id} data-lit={highlightedFamily === family.id}>
                <Collapsible id={`moons-${family.id}`} title={`${family.label} (${family.moons.length})`} remember={false} nested onOpenChange={(open) => toggleLight(family, open)}>
                  <p className="moon-note">{family.description}</p>
                  {named.length > 0 && <ul className="moon-list">{named.map((moon) => moonButton(moon))}</ul>}
                  {unnamed.length > 0 && (
                    <Collapsible id={`moons-${family.id}-unnamed`} title={`+${unnamed.length} unnamed`} remember={false} level={4} nested>
                      <ul className="moon-list">{unnamed.map((moon) => moonButton(moon))}</ul>
                    </Collapsible>
                  )}
                </Collapsible>
              </div>
            );
          })}
      </div>
    </section>
  );
}
