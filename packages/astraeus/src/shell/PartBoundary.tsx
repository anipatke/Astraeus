// A shelf part's error boundary (viewer-interface note, section 11, "One contract"). Job: when a part's view throws, draw one short line in the part's own place and report the error to the page,
// so the rest of the viewer (canvas, bar, the panel's title and Close, other blocks) stays. It must not name a part or import a shelf module; a part draws itself through `part.view`.
import { Component, type ReactNode } from "react";
import { reportToPage } from "../api/listeners";

/** Catches a throw in one part's view; the boundary resets when its part is drawn again (give it a `key`, or remount it). */
export class PartBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    reportToPage(error);
  }

  render(): ReactNode {
    if (this.state.failed)
      return (
        <p className="part-failed" role="status">
          This part could not be drawn.
        </p>
      );
    return this.props.children;
  }
}
