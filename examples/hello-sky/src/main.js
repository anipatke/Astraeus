import "astraeus/style.css";
import { Scene, earth, mount, solarSystemScale, sun } from "astraeus";
import { constellations } from "astraeus-data-constellations";

// Looking out from Earth's centre toward Orion, with Orion's story in three steps. The figures come from the constellations package; the words are this example's own, short and plain.
const VIEW = { lookOut: "earth" };
// Right ascension and declination (J2000, degrees) of the middle of the belt and sword, and of the span between Betelgeuse and Rigel, so a step turns the view to what it talks about.
const BELT_AND_SWORD = { raDeg: 84, decDeg: -3 };
const WHOLE_HUNTER = { raDeg: 83.7, decDeg: 0 };

const provenance = {
  sourceType: "illustrative",
  sources: ["Orion's figure: the IAU constellation figure, as typed in by the Stellarium team (CC BY-SA 4.0), shipped in astraeus-data-constellations", "The words: written for this example from general star knowledge"],
  accuracy: "Simple statements, not measurements. The figure's lines join Hipparcos stars; where a line runs is a convention.",
  notes: "A short example story, not a reference.",
};

const story = [
  {
    id: "the-hunter", title: "The hunter", provenance, object: "Ori", camera: { ...VIEW, direction: WHOLE_HUNTER, fovDeg: 60 },
    body: ["You are standing at Earth's centre, looking out at the sky toward Orion. Its stars are there, but the figure is hidden until the story traces it.", "Orion is one of the 88 constellations. Press Next to trace the hunter."],
  },
  {
    id: "belt-and-sword", title: "Belt and sword", provenance, object: "Ori", camera: { ...VIEW, direction: BELT_AND_SWORD, fovDeg: 28 }, select: true, trace: { durationSeconds: 2, after: "stay" },
    body: ["Three stars in a short row make the hunter's belt. Below them hangs his sword.", "The middle of the sword looks like a hazy patch: the Orion Nebula, a cloud of gas where new stars are forming."],
  },
  {
    id: "betelgeuse-and-rigel", title: "Betelgeuse and Rigel", provenance, object: "Ori", camera: { ...VIEW, direction: WHOLE_HUNTER, fovDeg: 38 }, select: true, trace: { durationSeconds: 2, after: "stay" },
    body: ["Betelgeuse, at the hunter's shoulder, is a red supergiant. Rigel, at his foot, is blue-white. Both are among the brightest stars in the sky.", "Tap Orion's name to open its card, or try the switches for the Sun's path (the ecliptic)."],
  },
];

// Orion is hidden until traced; its neighbours show faintly so the sky has some shape around it.
const neighbours = await constellations(["Tau", "Gem", "CMa", "Lep", "Mon"], { color: "#34475f", labelColor: "#6f819a" });
const orion = await constellations(["Ori"], { shown: "whenTraced", color: "#9ecbff" });

const scene = new Scene()
  .addBody(sun)
  .addBody(earth, { orbit: true, enlarge: 60 })
  .addSkyFigures([...neighbours, ...orion])
  .addStoryPanels(story)
  .setSwitches({ skyFigures: { place: "top-bar" }, ecliptic: { place: "panel" } })
  .setScale(solarSystemScale)
  .setTime("2027-01-15T00:00:00Z")
  .setTimeline({ start: Date.parse("2027-01-01T00:00:00Z"), end: Date.parse("2027-02-01T00:00:00Z") });
scene.camera.lookOut("earth", { direction: { raDeg: 83.7, decDeg: 0 }, fovDeg: 60 });

const viewer = mount(document.getElementById("app"), scene);
await viewer.ready;
// The handle is on the window so the browser console (and the browser check) can read `viewer.camera` or call `viewer.setPanel("belt-and-sword")`.
window.viewer = viewer;
