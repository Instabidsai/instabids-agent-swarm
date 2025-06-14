// ui/src/pages/index.tsx
import React, { useState } from 'react';
import { ProjectIntakeForm } from '@/components/ProjectIntakeForm';
import { AgentSwarmVisualizer } from '@/components/AgentSwarmVisualizer';
import { ProjectStatusDisplay } from '@/components/ProjectStatusDisplay';
import { useAgentSwarmSocket } from '@/hooks/useAgentSwarmSocket';

const HomePage = () => {
    const [projectId, setProjectId] = useState<string | null>(null);
    const { agents, projectStage, lastMessage, isConnected } = useAgentSwarmSocket(projectId);

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <div className="container mx-auto p-4 sm:p-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800">InstaBids Living UI</h1>
                    <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
                        Interact directly with the agent swarm and see them work on your project in real-time.
                    </p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
                        {!projectId ? (
                            <ProjectIntakeForm onSubmissionSuccess={setProjectId} />
                        ) : (
                            <ProjectStatusDisplay
                                projectId={projectId}
                                stage={projectStage}
                                lastMessage={lastMessage}
                            />
                        )}
                    </div>
                    <div className="lg:col-span-2 bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-gray-700">Live Agent Swarm</h2>
                            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
                        </div>
                        <AgentSwarmVisualizer agents={agents} />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default HomePage;
