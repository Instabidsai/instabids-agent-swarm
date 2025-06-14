import React from 'react';
import { motion } from 'framer-motion';

interface ProjectStatusDisplayProps {
    projectId: string;
    stage: string;
    lastMessage: string;
}

export const ProjectStatusDisplay: React.FC<ProjectStatusDisplayProps> = ({ projectId, stage, lastMessage }) => {
    // This is a simplified chat interface. A real implementation would use
    // the CopilotKit chat components for a richer experience.
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800">Project In Progress</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">ID: {projectId}</p>
            </div>

            <div className="p-4 bg-gray-50 border rounded-lg h-64 overflow-y-auto flex flex-col space-y-4">
                {/* Message History would be rendered here */}
                {lastMessage && (
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-blue-100 text-blue-800 rounded-lg max-w-md"
                    >
                       <p className="font-semibold">Agent Message:</p>
                       <p>{lastMessage}</p>
                    </motion.div>
                )}
            </div>

            <div>
                <input
                    type="text"
                    placeholder="Type your reply to the agent..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    // onChange and onKeyDown would be used to send messages back to the swarm
                />
            </div>

            <div className="text-center text-gray-600">
                Current Stage: <span className="font-semibold capitalize">{stage.replace('_', ' ')}</span>
            </div>
        </motion.div>
    );
};
