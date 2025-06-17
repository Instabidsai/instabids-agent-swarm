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

export const LiveIntakeAnalysis: React.FC = () => {
  useCoAgentStateRender<IntakeAgentState>({
    name: 'homeowner_intake_agent', // Listen specifically to this agent
    render: ({ state }) => {
      if (!state.structured_requirements || state.structured_requirements.length === 0) {
        return (
          <div className="p-4 text-center text-gray-500">
            <Zap className="mx-auto h-8 w-8 animate-pulse text-blue-500" />
            <p>AI is listening and ready to analyze your project description...</p>
          </div>
        );
      }
      return (
        <div className="p-4 bg-white rounded-lg shadow-inner border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700">
            <FileText className="mr-2 h-5 w-5 text-blue-600" />
            Live Project Analysis
          </h3>
          <ul className="space-y-2">
            <AnimatePresence>
              {state.structured_requirements.map((req, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-3 bg-gray-50 rounded-md"
                >
                  <strong className="text-gray-800">{req.category}:</strong>
                  <span className="text-gray-600 ml-2">{req.requirement}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      );
    },
  });

  return null; // The hook renders the component into the chat pane
};
