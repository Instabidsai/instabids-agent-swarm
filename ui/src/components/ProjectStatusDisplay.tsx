import React, { useState, useEffect } from 'react';

export const ProjectStatusDisplay = () => {
  const [projectStatus, setProjectStatus] = useState('No active project.');

  // This would be replaced with a real-time subscription (e.g., WebSocket)
  useEffect(() => {
    const mockStatusUpdates = [
      'Project submitted. Intake agent is processing...',
      'Intake complete. Scoping agent is analyzing requirements...',
      'Scope complete. Awaiting payment to release contact info...',
    ];
    let index = 0;
    const interval = setInterval(() => {
      setProjectStatus(mockStatusUpdates[index]);
      index = (index + 1) % mockStatusUpdates.length;
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border rounded-lg my-4 bg-blue-50">
      <h2 className="text-lg font-bold mb-2">Project Status</h2>
      <p>{projectStatus}</p>
    </div>
  );
};