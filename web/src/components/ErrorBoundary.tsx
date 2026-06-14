import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

// App-level safety net. Catches render/runtime errors anywhere in the tree and
// shows a friendly recovery screen instead of a white page. Errors are logged
// to the console (and could be forwarded to analytics later).
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app">
        <main className="screen">
          <div className="stub" style={{ paddingTop: 64 }}>
            <div className="icn">🥃</div>
            <h3>Something spilled</h3>
            <p>An unexpected error tripped up this screen. Your data is safe.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
              <button className="btn block" onClick={this.reset}>Try again</button>
              <a className="btn ghost block" href="/" style={{ textAlign: "center" }}>Back to home</a>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
