import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

const AgentStateSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(['idle', 'processing', 'waiting', 'active', 'error']),
  currentTask: z.string().optional(),
});
type AgentState = z.infer<typeof AgentStateSchema>;

const SwarmUpdateSchema = z.object({
  type: z.literal('swarm_status'),
  payload: z.array(AgentStateSchema),
});

const ProjectUpdateSchema = z.object({
  type: z.literal('project_update'),
  payload: z.object({
    projectId: z.string(),
    stage: z.string(),
    message: z.string(),
  }),
});

const IncomingMessageSchema = z.union([SwarmUpdateSchema, ProjectUpdateSchema]);

export function useAgentSwarmSocket(projectId: string | null) {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [projectStage, setProjectStage] = useState('intake');
  const [lastMessage, setLastMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const parsedData = JSON.parse(event.data);
      const message = IncomingMessageSchema.parse(parsedData);

      if (message.type === 'swarm_status') {
        setAgents(message.payload);
      } else if (message.type === 'project_update' && message.payload.projectId === projectId) {
        setProjectStage(message.payload.stage);
        setLastMessage(message.payload.message);
      }
    } catch (error) {
      console.error("WebSocket message parse error:", error);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    // In a real app, this URL comes from an environment variable.
    const ws = new WebSocket('ws://localhost:8000/ws/' + projectId);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = handleMessage;

    return () => {
      ws.close();
    };
  }, [projectId, handleMessage]);

  return { agents, projectStage, lastMessage, isConnected };
}
