export interface PublicBuildCheck {
  name: string;
  script: string;
  results?: boolean;
}
export const CHECKS: PublicBuildCheck[];
export function runChecks(options: {
  distDir: string;
  evidenceDir: string;
  checks?: PublicBuildCheck[];
  limits?: unknown;
  log?: (text: string) => void;
}): { ok: boolean; rows: { name: string; passed: boolean; seconds: number }[] };
export function checkPublicBuild(options?: {
  build?: (distDir: string) => { status: number | null; stdout?: string; stderr?: string };
  checks?: PublicBuildCheck[];
  evidenceRoot?: string;
}): number;
