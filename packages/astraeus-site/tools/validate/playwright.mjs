// The one place browser scripts load playwright-core: the project's own devDependency, or the file named by PLAYWRIGHT_CORE when set (optional override).
export const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
