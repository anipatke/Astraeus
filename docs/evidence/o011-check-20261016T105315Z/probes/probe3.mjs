const pw = await import(process.env.PLAYWRIGHT_CORE); const chromium = pw.chromium ?? pw.default.chromium;
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const out = "/tmp/claude-1000/-home-user-code-Astraeus/9f41da67-d196-4cdd-b989-572f65eae286/scratchpad/probes/";
for (const [n, c] of [["pubper", "app.html?experience=shower-perseids"]]) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto("http://localhost:5451/" + c); await p.waitForTimeout(6000);
  await p.screenshot({ path: out + n + ".png" });
  const t = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  console.log(n, (t.match(/[^.]{0,120}(fetch|not available|absent|missing|no measured|local)[^.]{0,160}/i) || ["(no message)"])[0]);
  await p.close();
}
await b.close();
