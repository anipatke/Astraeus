import type { ReactNode } from "react";

/** The top bar's icons (stroke icons from the approved mock-up); each is decoration, the button carries the name. */
function Icon({ size = 18, strokeWidth = 1.8, children }: { readonly size?: number; readonly strokeWidth?: number; readonly children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const InfoIcon = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r="0.6" fill="currentColor" /></Icon>;
export const FocusIcon = () => <Icon><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></Icon>;
export const OverviewIcon = () => <Icon><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Icon>;
export const FollowIcon = () => <Icon><circle cx="12" cy="12" r="4" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /></Icon>;
export const OrbitIcon = () => <Icon><ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-20 12 12)" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /></Icon>;
export const ScaleIcon = () => <Icon size={16}><circle cx="7" cy="12" r="2.5" /><circle cx="16" cy="12" r="5.5" /></Icon>;
export const ChevronIcon = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M2 4l4 4 4-4" /></svg>;
export const CogIcon = () => (
  <Icon size={19} strokeWidth={1.7}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icon>
);
