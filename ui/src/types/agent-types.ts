// This file centralizes the core TypeScript types for our application's state,
// ensuring that both the frontend components and the agent state hooks
// share the same data structures.

export interface AgentStatus {
  id: string;
  type: 'homeowner_intake' | 'project_scope' | 'communication_filter' | 'payment_gate' | 'media_processor';
  status: 'idle' | 'processing' | 'waiting' | 'error';
  currentTask?: string;
  progress?: number;
}

export interface AgentSwarmState {
  agents: AgentStatus[];
  healthStatus: 'healthy' | 'degraded' | 'critical';
  systemLoad: number;
}

export interface ProjectState {
  id: string;
  currentStage: 'intake' | 'scoping' | 'matching' | 'payment' | 'complete';
  status: 'pending' | 'in_progress' | 'requires_approval' | 'completed' | 'failed';
  // This will be populated by the 'LiveIntakeAnalysis' component later
  liveAnalysis?: { category: string; requirement: string }[];
}
