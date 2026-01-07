import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error; info?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log detalhado pra você ver no console do Dyad
    console.error("❌ ErrorBoundary captured:", error);
    console.error("ℹ️ Component stack:", errorInfo.componentStack);
    this.setState({ info: errorInfo.componentStack });
  }

  handleReload = () => {
    // Limpa caches comuns que causam loop de role/estado
    try {
      localStorage.removeItem("burger-hero-auth");
    } catch {}
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 20,
          background: "#0b1220",
          color: "#fff",
          fontFamily: "ui-sans-serif, system-ui, -apple-system",
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>O app quebrou (erro real abaixo)</h1>

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 8 }}>Mensagem:</div>
          <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
            {this.state.error?.message || "Erro desconhecido"}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            maxHeight: "40vh",
            overflow: "auto",
          }}
        >
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 8 }}>Stack:</div>
          <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {this.state.error?.stack || "(sem stack)"}
          </pre>

          {this.state.info ? (
            <>
              <div style={{ opacity: 0.8, fontSize: 12, margin: "12px 0 8px" }}>
                Component Stack:
              </div>
              <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
                {this.state.info}
              </pre>
            </>
          ) : null}
        </div>

        <button
          onClick={this.handleReload}
          style={{
            background: "#2563eb",
            border: "none",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Limpar cache e recarregar
        </button>
      </div>
    );
  }
}
