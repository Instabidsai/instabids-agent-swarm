// ui/src/pages/index.tsx
import React from 'react';
import { ProjectIntakeForm } from '@/components/ProjectIntakeForm';
import { AgentSwarmVisualizer } from '@/components/AgentSwarmVisualizer';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <div className="container mx-auto p-4 sm:p-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Welcome to Instabids</h1>
                    <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
                        Describe your project, and our AI agent swarm will handle everything from scoping and security to finding the perfect contractor.
                    </p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
                        <ProjectIntakeForm />
                    </div>
                    <div className="lg:col-span-2 bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-200">
                        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700">Live Agent Swarm Activity</h2>
                        <AgentSwarmVisualizer />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default HomePage;