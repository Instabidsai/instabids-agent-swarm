// This component provides a real-time view into the HomeownerIntakeAgent's analysis.
// It uses `useCoAgentStateRender` to listen for state changes specifically from the
// intake agent and renders the extracted project requirements as they are identified.

import React from 'react';
import { useCoAgentStateRender } from '@copilotkit/react-core';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Zap } from 'lucide-react';

interface Requirement {
  category: string;
  requirement: string;
}

interface IntakeAgentState {
  structured_requirements?: Requirement[];
  status?: 'analyzing' | 'structuring' | 'complete';
}

export const LiveProjectAnalysis: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        2. Live AI Analysis
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        As you chat with our assistant, our agent swarm will analyze your needs in real-time. Watch as it builds a structured understanding of your project below.
      </p>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner border border-gray-200 dark:border-gray-600 min-h-[60vh]">
        <RenderAnalysis />
      </div>
    </div>
  );
};

const RenderAnalysis = () => {
  useCoAgentStateRender<IntakeAgentState>({
    name: 'homeowner_intake_agent', // Listen specifically to this agent
    render: ({ state }) => {
      if (!state.structured_requirements || state.structured_requirements.length === 0) {
        return (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Zap className="mx-auto h-12 w-12 animate-pulse text-blue-500" />
            <p className="mt-4">AI is listening... Describe your project in the chat to begin analysis.</p>
          </div>
        );
      }
      return (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700 dark:text-gray-200">
            <FileText className="mr-2 h-5 w-5 text-blue-500" />
            Extracted Project Details
          </h3>
          <ul className="space-y-2">
            <AnimatePresence>
              {state.structured_requirements.map((req, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-3 bg-white dark:bg-gray-800 rounded-md shadow"
                >
                  <strong className="text-gray-800 dark:text-gray-100">{req.category}:</strong>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">{req.requirement}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      );
    },
  });

  return null; // The hook renders the component into the main application context, not a specific chat pane.
}
