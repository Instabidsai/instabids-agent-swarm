import React from 'react';

export const AgentSwarmVisualizer = () => {
  // Mock data for agent activity
  const agents = [
    { id: 'intake-01', type: 'Intake', status: 'active' },
    { id: 'scope-01', type: 'Scoping', status: 'idle' },
    { id: 'security-01', type: 'Security', status: 'active' },
    { id: 'payment-01', type: 'Payment', status: 'idle' },
  ];

  return (
    <div className="p-4 border rounded-lg my-4 bg-gray-50">
      <h2 className="text-lg font-bold mb-2">Agent Swarm Activity</h2>
      <div className="grid grid-cols-4 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className={`p-2 border rounded-md ${agent.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
            <div className="font-semibold">{agent.type}</div>
            <div className="text-sm">Status: {agent.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
};