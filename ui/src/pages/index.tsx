import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ProjectIntakeForm } from '@/components/ProjectIntakeForm';
import { AgentSwarmVisualizer } from '@/components/AgentSwarmVisualizer';

const HomePage = () => {
    const [projectId, setProjectId] = useState<string | null>(null);

    const handleSubmission = (id: string) => {
        setProjectId(id);
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans text-gray-200">
            <main className="w-full max-w-3xl mx-auto flex flex-col items-center text-center">
                
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                    <Image
                        src="/logo.png"
                        alt="InstaBids Logo"
                        width={150}
                        height={150}
                        className="mb-6"
                        priority
                    />
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-4"
                >
                    Build Your Vision
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="text-lg text-gray-400 mb-12 max-w-xl"
                >
                    Describe your project, and our agent swarm will handle the rest.
                </motion.p>
                
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="w-full">
                        <ProjectIntakeForm onSubmissionSuccess={handleSubmission} />
                    </div>
                    <div className="w-full h-full">
                        <AgentSwarmVisualizer />
                    </div>
                </div>

            </main>
        </div>
    );
};
export default HomePage;