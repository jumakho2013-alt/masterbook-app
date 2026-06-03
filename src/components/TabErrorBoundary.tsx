import React from 'react';
import { ErrorScreen } from '@/src/components/ErrorScreen';
import { captureException } from '@/src/lib/crashReporter';

interface TabErrorBoundaryProps {
  /** Имя таба для tag в crash reporter. */
  tabName: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Per-tab Error Boundary.
 *
 * Зачем: expo-router имеет root-level ErrorBoundary, но он ловит ошибку
 * рендера ВСЕГО приложения и сбрасывает весь UI. Если упадёт только табик
 * «Финансы» из-за corrupted entry — не должна разваливаться остальная app.
 *
 * Локальный boundary позволяет:
 *   1. Показать тот же ErrorScreen но В пределах таба (другие табы работают)
 *   2. «Попробовать снова» сбрасывает только этот таб, а не весь app
 *   3. captureException(err, { tag: 'tab:finances' }) — точнее диагностика
 *      в Sentry чем единственный 'router' тег
 *
 * React class component — единственный способ ErrorBoundary в React.
 */
export class TabErrorBoundary extends React.Component<TabErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      tag: `tab:${this.props.tabName}`,
      extra: { componentStack: info.componentStack ?? '' },
    });
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorScreen error={this.state.error} retry={this.retry} />;
    }
    return <>{this.props.children}</>;
  }
}
