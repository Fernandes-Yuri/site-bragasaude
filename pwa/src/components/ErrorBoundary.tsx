import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("ErrorBoundary capturou erro de componente:", error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 my-2 text-center bg-slate-50 border border-slate-200 rounded-2xl">
          <p className="text-xs text-slate-600 mb-2">Uma atualização foi aplicada no aplicativo.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#00897B] rounded-lg hover:bg-[#00796B]"
          >
            Atualizar tela
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
