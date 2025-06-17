// This modification enhances the main page.
// - It removes the static `AgentSwarmVisualizer` and `ProjectStatusDisplay`.
// - It integrates the new `LiveIntakeAnalysis` to show real-time agent "thinking".
// - It includes the `ProjectApprovalAction` to enable the HITL workflow.
// - It uses the new `useSharedAgentState` hook to get project status.

import { ProjectIntakeForm } from "@/components/ProjectIntakeForm";
import { LiveIntakeAnalysis } from "@/components/LiveIntakeAnalysis"; // IMPORT NEW
import { ProjectApprovalAction } from "@/components/ProjectApprovalAction"; // IMPORT NEW
import { useSharedAgentState } from "@/contexts/AgentSwarmContext"; // IMPORT NEW
import { motion } from 'framer-motion';

export default function Home() {
  const { state } = useSharedAgentState();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gray-100">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/50">
          InstaBids Agent Swarm
        </p>
      </div>

      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ProjectIntakeForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* This component will now render inside the chat pane automatically */}
          <LiveIntakeAnalysis />
        </motion.div>
      </div>
      
      {/* This component registers the HITL action but renders nothing itself */}
      <ProjectApprovalAction />

      <footer className="w-full text-center text-gray-500 mt-12">
        <p>Project Status: <span className="font-semibold text-blue-600">{state.project.status}</span></p>
        <p>Current Stage: <span className="font-semibold text-blue-600">{state.project.currentStage}</span></p>
      </footer>
    </main>
  );
}
