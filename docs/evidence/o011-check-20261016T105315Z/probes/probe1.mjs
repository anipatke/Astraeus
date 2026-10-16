const pw = await import(process.env.PLAYWRIGHT_CORE); const chromium = pw.chromium ?? pw.default.chromium;
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const base = "http://localhost:5450/app.html";
const cases = [
  "?experience=shower-perseids",
  "?experience=shower-perseids&source=cams",
  "?experience=shower-perseids&source=bogus",
  "?experience=shower-geminids&source=gmn",
  "?experience=shower-perseids&view=garbage",
  "?experience=shower-perseids&view=sun,10,20,-5",
  "?experience=shower-perseids&view=sun,10,95,4000000",
  "?experience=shower-perseids&view=nosuchbody,10,20,4000000",
  "?experience=apollo11&view=moon,30,10,20000&t=1969-07-20T20:17:40Z",
  "?experience=apollo11&t=not-a-date",
];
for (const c of cases) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 160)));
  p.on("pageerror", (e) => errs.push("PAGEERROR " + String(e).slice(0, 160)));
  await p.goto(base + c); await p.waitForTimeout(5000);
  const txt = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  const src = (txt.match(/(Orbits? from [A-Z]+|source[^.]{0,80})/i) || [""])[0];
  const time = (txt.match(/\d{4}-\d\d-\d\dT[\d:.]+Z/) || [""])[0];
  const obj = await p.locator("select").first().inputValue().catch(() => "?");
  console.log(JSON.stringify({ c, errs, obj, time, src: src.slice(0, 90), canvas: await p.locator("canvas").count() }));
  await p.close();
}
await b.close();
