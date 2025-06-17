import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { CopilotKit } from '@copilotkit/react-core';
import "@copilotkit/react-ui/styles.css";
import { AgentSwarmProvider } from '../contexts/AgentSwarmContext'; // IMPORT

export default function App({ Component, pageProps }: AppProps) {
  return (
    // Wrap with CopilotKit and our new AgentSwarmProvider
    <CopilotKit runtimeUrl="/api/copilotkit">
      <AgentSwarmProvider>
        <Component {...pageProps} />
      </AgentSwarmProvider>
    </CopilotKit>
  );
}
