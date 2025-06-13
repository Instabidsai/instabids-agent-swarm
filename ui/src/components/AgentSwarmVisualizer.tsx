// ui/src/components/AgentSwarmVisualizer.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_AGENTS_DATA = [
    { id: 'intake_01', type: 'Intake', status: 'processing' },
    { id: 'security_01', type: 'Security', status: 'active' },
    { id: 'scope_01', type: 'Scoping', status: 'waiting' },
    { id: 'payment_01', type: 'Payment', status: 'idle' },
    { id: 'data_01', type: 'Data', status: 'idle' },
];

export const AgentSwarmVisualizer = () => {
    const [agents, setAgents] = useState<any[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAgents(prev => {
                if (prev.length < MOCK_AGENTS_DATA.length) {
                    return [...prev, MOCK_AGENTS_DATA[prev.length]];
                }
                return prev.map(agent => ({ ...agent, status: ['idle', 'waiting', 'processing', 'active'][Math.floor(Math.random() * 4)] }));
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'processing': return { borderColor: '#3b82f6', textColor: 'text-blue-600' };
            case 'active': return { borderColor: '#16a34a', textColor: 'text-green-600' };
            case 'waiting': return { borderColor: '#f59e0b', textColor: 'text-yellow-600' };
            default: return { borderColor: '#9ca3af', textColor: 'text-gray-500' };
        }
    };

    return (
        <div className="relative h-96 w-full flex items-center justify-center bg-dots">
            <style jsx>{`.bg-dots { background-image: radial-gradient(#d1d5db 1px, transparent 1px); background-size: 20px 20px; }`}</style>
            <AnimatePresence>
                {agents.map((agent, index) => {
                    const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
                    const radius = agents.length > 1 ? 120 : 0;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    const { borderColor, textColor } = getStatusStyles(agent.status);
                    return (
                        <motion.div key={agent.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1, x, y }} exit={{ opacity: 0, scale: 0.5 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="absolute flex flex-col items-center group">
                            <div className="relative">
                                <div className="w-24 h-24 bg-white rounded-full border-4 flex items-center justify-center shadow-md" style={{ borderColor }}>
                                    <div className="text-center">
                                        <div className="font-bold text-base text-gray-800">{agent.type}</div>
                                        <div className="text-xs text-gray-500">{agent.id.split('_')[1]}</div>
                                    </div>
                                </div>
                                {agent.status === 'processing' && <div className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 rounded-full bg-blue-500 animate-ping" />}
                            </div>
                            <div className={`mt-2 text-sm font-semibold capitalize ${textColor}`}>{agent.status}</div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
