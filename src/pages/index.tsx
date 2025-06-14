// src/pages/index.tsx
import React, { useState } from 'react';
import { ProjectIntakeForm } from '@/components/ProjectIntakeForm';
import { AgentSwarmVisualizer } from '@/components/AgentSwarmVisualizer';

const HomePage = () => {
    const [projectId, setProjectId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <div className="container mx-auto p-4 sm:p-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800">InstaBids Agent Swarm</h1>
                    <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
                        Describe your project and watch our AI agent swarm process it in real-time.
                    </p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
                        <ProjectIntakeForm onSubmissionSuccess={setProjectId} />
                    </div>
                    <div className="lg:col-span-2 bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-gray-700">Live Agent Swarm</h2>
                        </div>
                        <AgentSwarmVisualizer />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default HomePage;