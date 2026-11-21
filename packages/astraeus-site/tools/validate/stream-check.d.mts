export function assertStreamDrawn(dots: number, label: string): number;
export function assertSceneDrawn<T extends { bodies: number; dots: number; paths: number }>(drawn: T, label: string): T;
