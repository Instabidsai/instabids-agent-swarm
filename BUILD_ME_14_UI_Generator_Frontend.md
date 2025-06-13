# BUILD ME 14 - Agent 6 - UI Generator & Frontend

Instructions for Execution Agent: This document contains the complete and final code for the UI. Your task is to populate the existing files within the agents/ui_generator/ and ui/ directories with the code provided below. DO NOT create new files or modify any logic.

## Part A: UI Generator Agent (Backend)

### agents/ui_generator/ui_agent.py
```python
# agents/ui_generator/ui_agent.py
import json
from typing import Dict, Any
from core.base.base_agent import BaseAgent

class UIGeneratorAgent(BaseAgent):
    """
    Listens to system-wide events and pushes formatted updates to a dedicated Redis stream,
    which a frontend WebSocket server would consume to provide real-time UI updates.
    """
    def __init__(self, agent_id: str = None):
        super().__init__(
            agent_type='ui_generator',
            stream_name='ui:updates', # Consumes events from a dedicated UI update stream
            group_name='ui_generators',
            agent_id=agent_id
        )
    
    async def process_event(self, event_data: Dict[str, Any]) -> None:
        """
        This agent's primary role is to listen to events from other agents and
        re-publish them in a format suitable for the frontend. For simplicity,
        we'll just log the action. In a real system, this would involve transforming
        the event into a standardized UI state object.
        """
        event_type = event_data.get('event_type')
        raw_data = json.loads(event_data.get('data', '{}'))
        project_id = raw_data.get('project_id')
        
        self.logger.info(f"UI-Generator received event '{event_type}' for project '{project_id}'. A real-time update would be pushed to the UI.")
        # Example of re-publishing to a project-specific websocket channel
        # await self.event_publisher.publish(
        #     stream=f"ws:project:{project_id}",
        #     event_type="ui:state_change",
        #     data={"event": event_type, "details": raw_data}
        # )
```

## Part B: React/Next.js Frontend (ui/)

### ui/package.json
```json
{
  "name": "instabids-ui",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "framer-motion": "^10.16.16",
    "next": "14.0.4",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.4",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
```

### ui/src/pages/_app.tsx
```tsx
// ui/src/pages/_app.tsx
import '@/styles/globals.css' // Assuming you will create this file
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

**Note: Create an empty ui/src/styles/globals.css file for the import to work.**

### ui/src/pages/index.tsx
```tsx
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
```

### ui/src/components/ProjectIntakeForm.tsx
```tsx
// ui/src/components/ProjectIntakeForm.tsx
import React, { useState } from 'react';

export const ProjectIntakeForm = () => {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('submitting');
        setError(null);
        const formData = new FormData(event.currentTarget);
        const submissionData = {
            project_id: `proj_${new Date().getTime()}`,
            contact_info: {
                first_name: formData.get('first_name') as string,
                last_name: formData.get('last_name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                zip_code: formData.get('zip_code') as string,
                city: "Anytown", state: "AS",
            },
            project_details: { raw_description: formData.get('raw_description') as string }
        };

        try {
            const response = await fetch('/api/projects/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });
            if (!response.ok) throw new Error((await response.json()).detail || 'Failed to submit.');
            const result = await response.json();
            setProjectId(result.projectId);
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setError(err.message);
        }
    };

    if (status === 'success') {
        return (
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-2xl font-semibold text-green-800">Thank You!</h3>
                <p className="mt-2 text-gray-700">Your project (ID: {projectId}) has been submitted to our agent swarm. You can monitor their real-time activity to the right.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800">1. Describe Your Project</h3>
            </div>
            <textarea name="raw_description" rows={8} placeholder="e.g., 'I want to remodel my master bathroom. This includes a walk-in shower, new double vanity, and new floor tiles.'" required className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition"/>
            <h3 className="text-2xl font-bold text-gray-800 text-center">2. Your Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="first_name" type="text" placeholder="First Name" required className="p-3 border rounded-md"/>
                <input name="last_name" type="text" placeholder="Last Name" required className="p-3 border rounded-md"/>
                <input name="email" type="email" placeholder="Email Address" required className="p-3 border rounded-md"/>
                <input name="phone" type="tel" placeholder="Phone Number" required className="p-3 border rounded-md"/>
            </div>
            <input name="zip_code" type="text" placeholder="Project Zip Code" required className="w-full p-3 border rounded-md"/>
            {status === 'error' && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            <button type="submit" disabled={status === 'submitting'} className="w-full bg-blue-600 text-white p-4 rounded-md font-bold text-lg hover:bg-blue-700 transition disabled:bg-gray-400">
                {status === 'submitting' ? 'Submitting to Swarm...' : 'Activate Agent Swarm'}
            </button>
        </form>
    );
};
```

### ui/src/components/AgentSwarmVisualizer.tsx
```tsx
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
```