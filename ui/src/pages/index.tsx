// ui/src/pages/index.tsx
import React, { useState } from 'react';
import { ProjectIntakeForm } from '@/components/ProjectIntakeForm';
import { AgentSwarmVisualizer } from '@/components/AgentSwarmVisualizer';
import { LiveChatButton } from '@/components/LiveChatButton';

const HomePage = () => {
    const [projectId, setProjectId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <div className="container mx-auto p-4 sm:p-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800">InstaBids Conversational AI</h1>
                    <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
                        Describe your project via text or start a live voice chat with our AI agent swarm.
                    </p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
                        {!projectId ? (
                            <ProjectIntakeForm onSubmissionSuccess={setProjectId} />
                        ) : (
                            <div className="text-center">
                                <h3 className="text-2xl font-semibold text-green-800">Project Submitted!</h3>
                                <p className="mt-2 text-gray-700">
                                    Your project (ID: {projectId}) is now being processed. You can start a live voice chat to add more details.
                                </p>
                                <div className="mt-6">
                                    <LiveChatButton projectId={projectId} />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-2 bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-200">
                        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700">Live Agent Swarm</h2>
                        <AgentSwarmVisualizer />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default HomePage;