import type { CSSProperties } from "react";

export interface LabelProps {
  readonly text: string;
  readonly className?: string;
  readonly color?: string;
  readonly hidden?: boolean;
}

/** Small reusable text label for projected scene points and timeline event markers. */
export function Label({ text, className = "", color, hidden = false }: LabelProps) {
  return (
    <span
      className={`astraeus-label ${className}`.trim()}
      style={color === undefined ? undefined : { "--label-color": color } as CSSProperties}
      hidden={hidden}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

/** DOM counterpart used by the imperative Three.js projection layer. */
export function createLabelElement(text: string, color?: string, className = ""): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = `astraeus-label ${className}`.trim();
  element.textContent = text;
  element.setAttribute("aria-hidden", "true");
  if (color !== undefined) element.style.setProperty("--label-color", color);
  return element;
}
