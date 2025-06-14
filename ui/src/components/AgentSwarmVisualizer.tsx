import React, { memo, useMemo, useState } from 'react';
import { useAgentSwarm, AgentState } from '../hooks/useAgentSwarm';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentNodeProps {
  agent: AgentState;
  position: { x: number; y: number };
  onClick: (agent: AgentState) => void;
}

const AgentNode = memo<AgentNodeProps>(({ agent, position, onClick }) => {
  const statusColor = useMemo(() => {
    switch (agent.status) {
      case 'processing': return '#10B981'; // green-500
      case 'waiting': return '#F59E0B';    // amber-500
      case 'error': return '#EF4444';      // red-500
      default: return '#6B7280';          // gray-500
    }
  }, [agent.status]);

  const agentTypeIcon = useMemo(() => {
    const icons: Record<AgentState['type'], string> = {
      homeowner_intake: '🏠',
      project_scope: '📋',
      communication_filter: '🛡️',
      payment: '💳',
      ui_generator: '🎨',
    };
    return icons[agent.type] || '🤖';
  }, [agent.type]);

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ left: position.x, top: position.y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.2, zIndex: 10 }}
      onClick={() => onClick(agent)}
    >
      <div
        className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl bg-gray-800 shadow-lg"
        style={{ borderColor: statusColor }}
      >
        {agentTypeIcon}
      </div>
       {agent.status === 'processing' && (
        <motion.div
          className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}
    </motion.div>
  );
});

AgentNode.displayName = 'AgentNode';

export function AgentSwarmVisualizer() {
  const { swarmState } = useAgentSwarm();
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);

  const agentPositions = useMemo(() => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const numAgents = swarmState.agents.length;
    if (numAgents === 0) return positions;

    const radius = 120;
    const centerX = 160; // Center of a 400px wide container
    const centerY = 160;

    swarmState.agents.forEach((agent, index) => {
      const angle = (index / numAgents) * 2 * Math.PI - Math.PI / 2;
      positions[agent.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });
    
    return positions;
  }, [swarmState.agents]);

  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      <AnimatePresence>
        {swarmState.agents.map(agent => (
          agentPositions[agent.id] && (
            <AgentNode
              key={agent.id}
              agent={agent}
              position={agentPositions[agent.id]}
              onClick={setSelectedAgent}
            />
          )
        ))}
      </AnimatePresence>
    </div>
  );
}