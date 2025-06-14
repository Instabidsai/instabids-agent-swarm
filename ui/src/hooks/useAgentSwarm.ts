import { useState, useEffect, useCallback } from 'react';

// Define the structure of an agent's state
export interface AgentState {
  id: string;
  type: 'homeowner_intake' | 'project_scope' | 'communication_filter' | 'payment' | 'ui_generator';
  status: 'idle' | 'processing' | 'waiting' | 'error';
  currentTask?: string;
  progress?: number;
  lastActivity: Date;
}

// Define the overall state of the swarm
export interface AgentSwarmState {
  agents: AgentState[];
  healthStatus: 'healthy' | 'degraded' | 'critical';
}

// Mock function to simulate real-time agent data
const useMockAgentData = (setSwarmState: React.Dispatch<React.SetStateAction<AgentSwarmState>>) => {
    useEffect(() => {
        const agentTypes: AgentState['type'][] = ['homeowner_intake', 'project_scope', 'communication_filter', 'payment', 'ui_generator'];
        
        const mockAgents: AgentState[] = agentTypes.map((type, i) => ({
            id: `${type}_${i}`,
            type: type,
            status: 'idle',
            lastActivity: new Date(),
            progress: 0,
            currentTask: 'Awaiting tasks'
        }));

        setSwarmState({ agents: mockAgents, healthStatus: 'healthy' });

        const interval = setInterval(() => {
            setSwarmState(prevState => {
                const newAgents = prevState.agents.map(agent => {
                    if (Math.random() > 0.7) { // 30% chance to change state
                        const newStatus = Math.random() > 0.3 ? 'processing' : 'idle';
                        return {
                            ...agent,
                            status: newStatus,
                            progress: newStatus === 'processing' ? Math.floor(Math.random() * 100) : 0,
                            currentTask: newStatus === 'processing' ? 'Analyzing project data...' : 'Awaiting tasks',
                            lastActivity: new Date()
                        };
                    }
                    return agent;
                });
                return { ...prevState, agents: newAgents };
            });
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [setSwarmState]);
};


export function useAgentSwarm() {
  const [swarmState, setSwarmState] = useState<AgentSwarmState>({
    agents: [],
    healthStatus: 'healthy'
  });
  
  // Using the mock data hook for demonstration
  // In a real application, this would connect to Supabase/WebSockets
  useMockAgentData(setSwarmState);

  return { swarmState, isHealthy: swarmState.healthStatus === 'healthy' };
}