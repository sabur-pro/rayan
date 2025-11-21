import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>Error details:</Text>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {this.state.error?.toString()}
              </Text>
            </View>
            {this.state.errorInfo && (
              <>
                <Text style={styles.subtitle}>Component Stack:</Text>
                <View style={styles.errorContainer}>
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
