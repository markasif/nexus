import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                            <p className="text-gray-500">
                                We encountered an unexpected error. Our team has been notified.
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg text-left hidden">
                            <p className="text-xs font-mono text-red-600 break-words">
                                {this.state.error?.message}
                            </p>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Button onClick={this.handleReload} className="w-full bg-nexus-primary hover:bg-nexus-primary/90">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
