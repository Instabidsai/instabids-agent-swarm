// This modification completely redesigns the main page.
// It removes the old static form and introduces a modern, two-column layout.
// The left column will house the new conversational chat interface,
// and the right column will display real-time agent activity and analysis.

import { ConversationalIntake } from "@/components/ConversationalIntake";
import { LiveProjectAnalysis } from "@/components/LiveProjectAnalysis";
import { ProjectApprovalAction } from "@/components/ProjectApprovalAction";

export default function Home() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-12 lg:p-24 bg-gray-100 dark:bg-gray-900">
        <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex mb-8">
          <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/50">
            InstaBids Agent Swarm
          </p>
        </div>

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: The Conversational UI */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
            <ConversationalIntake />
          </div>

          {/* Right Column: Live Agent Visualization */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
            <LiveProjectAnalysis />
          </div>
        </div>
      </main>
      
      {/* This component registers the Human-in-the-Loop action but renders nothing itself until called by the agent */}
      <ProjectApprovalAction />
    </>
  );
}