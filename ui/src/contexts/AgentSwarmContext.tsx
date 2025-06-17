// This context provides a single, shared source of truth for the agent's state,
// making it available to any component in the application. It uses the `useCoAgent`
// hook to establish the real-time, bidirectional connection to the backend agent swarm.

import React, { createContext, useContext, ReactNode } from 'react';
import { useCoAgent, CoAgentState } from '@copilotkit/react-core';
import { AgentSwarmState, ProjectState } from '../types/agent-types'; // We will create this file next.

// Define the shape of our combined agent state
interface InstabidsAgentContextState {
  swarm: AgentSwarmState;
  project: ProjectState;
}

const AgentSwarmContext = createContext<CoAgentState<InstabidsAgentContextState> | undefined>(undefined);

export const AgentSwarmProvider = ({ children }: { children: ReactNode }) => {
  const agentState = useCoAgent<InstabidsAgentContextState>({
    name: "instabids_swarm_supervisor", // Connect to the main supervisor agent
    initialState: {
      swarm: {
        agents: [],
        healthStatus: 'healthy',
        systemLoad: 0,
      },
      project: {
        id: '',
        currentStage: 'intake',
        status: 'pending',
      }
    },
  });

  return (
    <AgentSwarmContext.Provider value={agentState}>
      {children}
    </AgentSwarmContext.Provider>
  );
};

export const useSharedAgentState = () => {
  const context = useContext(AgentSwarmContext);
  if (context === undefined) {
    throw new Error('useSharedAgentState must be used within an AgentSwarmProvider');
  }
  return context;
};
