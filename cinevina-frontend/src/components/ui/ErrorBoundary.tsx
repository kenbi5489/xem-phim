import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#0c0e14',
          color: '#ef4444',
          padding: '30px',
          fontFamily: 'monospace',
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #ef4444', paddingBottom: '10px' }}>
            ⚠️ Ứng dụng đã xảy ra lỗi
          </h1>
          <div style={{ backgroundColor: '#1e1b4b', padding: '15px', borderRadius: '8px', border: '1px solid #3730a3' }}>
            <p style={{ fontWeight: 'bold', color: '#f87171' }}>{this.state.error && this.state.error.toString()}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '18px', color: '#9ca3af', marginBottom: '10px' }}>Chi tiết lỗi (Stack trace):</h3>
            <pre style={{
              backgroundColor: '#111827',
              padding: '15px',
              borderRadius: '8px',
              color: '#34d399',
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              lineHeight: '1.5'
            }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              alignSelf: 'flex-start'
            }}
          >
            Tải lại ứng dụng
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
