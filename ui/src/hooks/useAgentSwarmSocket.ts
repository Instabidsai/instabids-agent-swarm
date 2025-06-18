import { useEffect, useState } from 'react';

// EXPORT ADDED HERE
export interface AgentMessage {
  stream: string;
  data: {
    text_response?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// EXPORT ADDED HERE
export interface AgentSwarmSocketState {
  lastMessage: AgentMessage | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

// This is a placeholder for a real WebSocket implementation
export const useAgentSwarmSocket = (projectId: string): AgentSwarmSocketState => {
  const [swarmState, setSwarmState] = useState<AgentSwarmSocketState>({
    lastMessage: null,
    connectionStatus: 'disconnected'
  });

  useEffect(() => {
    // In a real application, you would connect to a WebSocket endpoint here
    // For example: const socket = new WebSocket('ws://localhost:8080/ws');
    console.log(`useAgentSwarmSocket hook initialized for project ${projectId} (mock).`);
    
    setSwarmState(prev => ({
      ...prev,
      connectionStatus: 'connected'
    }));

    // Mock some agent responses for testing
    const mockInterval = setInterval(() => {
      const mockMessages = [
        {
          stream: 'ai:agent_response',
          data: {
            text_response: 'I can see your project area. Let me analyze the space for renovation possibilities.'
          }
        },
        {
          stream: 'ai:agent_response', 
          data: {
            text_response: 'Based on what I can see, here are some recommendations for your project.'
          }
        }
      ];
      
      const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
      setSwarmState(prev => ({
        ...prev,
        lastMessage: randomMessage
      }));
    }, 10000); // Send a mock message every 10 seconds

    // Clean up the connection on component unmount
    return () => {
      clearInterval(mockInterval);
      setSwarmState(prev => ({
        ...prev,
        connectionStatus: 'disconnected'
      }));
    };
  }, [projectId]);

  return swarmState;
};
