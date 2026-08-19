import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#3D342D] flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-[#FCFAF7] border-2 border-[#E8DCC4] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FEF2F2] border-2 border-[#FCA5A5] text-[#991B1B] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-serif font-bold text-[#78350F]">
              VastuDrishti Application Recovered
            </h2>

            <p className="text-xs text-[#8B735B] leading-relaxed">
              An unexpected display variance occurred. Tap below to reload and refresh your Vastu compass alignment.
            </p>

            {this.state.error && (
              <div className="bg-[#FFFBEB] p-3 rounded-2xl border border-[#FEF3C7] text-[11px] text-[#78350F] font-mono text-left overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-[#78350F] hover:bg-[#5C280B] text-[#F3EFE0] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-[#D97706]" /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
