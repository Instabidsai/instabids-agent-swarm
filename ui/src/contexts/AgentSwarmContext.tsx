import React, { createContext, useContext, ReactNode } from 'react';
import { useCoAgent, UseCoAgentReturn } from '@copilotkit/react-core'; // CORRECTED IMPORT
import { AgentSwarmState, ProjectState } from '../types/agent-types';

interface InstabidsAgentContextState {
  swarm: AgentSwarmState;
  project: ProjectState;
}

// CORRECTED TYPE USAGE
const AgentSwarmContext = createContext<UseCoAgentReturn<InstabidsAgentContextState> | undefined>(undefined);

export const AgentSwarmProvider = ({ children }: { children: ReactNode }) => {
  const agentState = useCoAgent<InstabidsAgentContextState>({
    name: "instabids_swarm_supervisor",
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