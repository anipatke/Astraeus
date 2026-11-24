// A shelf part's error boundary (viewer-interface note, section 11, "One contract"). Job: when a part's view throws, draw one short line in the part's own place and report the error to the page,
// so the rest of the viewer (canvas, bar, the panel's title and Close, other blocks) stays. It must not name a part or import a shelf module; a part draws itself through `part.view`.
import { Component, type ReactNode } from "react";
import { reportToPage } from "../api/listeners";

interface Props {
  /** The id of the part drawn inside; a different id is a part drawn again, so the boundary resets (a view switch, a reopened panel). Required so no draw site can forget the reset. */
  readonly part: string;
  readonly children: ReactNode;
}

/** Catches a throw in one part's view; the boundary resets when its part is drawn again: when `part` changes, or when it is remounted. */
export class PartBoundary extends Component<Props, { failed: boolean; part: string }> {
  state = { failed: false, part: this.props.part };

  static getDerivedStateFromProps(
    props: Props,
    state: { failed: boolean; part: string },
  ): { failed: boolean; part: string } | null {
    return props.part === state.part ? null : { failed: false, part: props.part };
  }

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
