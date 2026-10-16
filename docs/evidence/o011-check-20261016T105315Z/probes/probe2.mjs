const pw = await import(process.env.PLAYWRIGHT_CORE); const chromium = pw.chromium ?? pw.default.chromium;
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const base = "http://localhost:5451/";
const out = "/tmp/claude-1000/-home-user-code-Astraeus/9f41da67-d196-4cdd-b989-572f65eae286/scratchpad/probes/";
for (const [i, c] of ["app.html?experience=shower-perseids", "app.html?experience=shower-perseids&source=cams", "app.html?experience=shower-geminids", "app.html", "index.html", "assets.html"].entries()) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; const fails = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 200)));
  p.on("pageerror", (e) => errs.push("PAGEERROR " + String(e).slice(0, 200)));
  p.on("requestfailed", (r) => fails.push(r.url().slice(-80)));
  p.on("response", (r) => r.status() >= 400 && fails.push(r.status() + " " + r.url().slice(-80)));
  await p.goto(base + c); await p.waitForTimeout(6000);
  const dev = p.getByRole("button", { name: /developer/i });
  let switches = "";
  if (await dev.count()) { await dev.first().click(); await p.waitForTimeout(800);
    switches = (await p.locator("body").innerText()).match(/Orbits from [A-Z]+/g)?.join(",") ?? ""; }
  const txt = (await p.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 160);
  await p.screenshot({ path: out + `pub-${i}.png` });
  console.log(JSON.stringify({ c, errs, fails, switches, txt }));
  await p.close();
}
await b.close();
