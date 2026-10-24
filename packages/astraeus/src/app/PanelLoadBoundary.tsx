import { Component, type ReactNode } from "react";

/**
 * Catches a failed on-demand load of a panel (the developer panels, the moon families; `message` replaces the default text) (offline, or a tab left open across a redeploy) so the
 * rest of the app keeps drawing; React.lazy keeps the failed load, so the message asks for a reload.
 */
export class PanelLoadBoundary extends Component<{ children: ReactNode; message?: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) return <p className="developer-loading" role="alert">{this.props.message ?? "Developer tools could not load. Reload the page to try again."}</p>;
    return this.props.children;
  }
}
