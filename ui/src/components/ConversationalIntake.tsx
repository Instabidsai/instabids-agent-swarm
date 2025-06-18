// This component provides the main chat interface for the user.
// It uses the CopilotKit chat component and provides it with a system prompt
// that instructs the HomeownerIntakeAgent on how to behave.

import { CopilotChat } from "@copilotkit/react-ui";

export function ConversationalIntake() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        1. Describe Your Project
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Start by telling our AI assistant about your project. You can type, or soon, use your voice and camera. The more details you provide, the better our agent swarm can understand your needs.
      </p>
      <div style={{ height: '60vh' }}>
        <CopilotChat
          labels={{
            title: "InstaBids Project Assistant",
            initial: "Hello! I'm here to help you get started. Please describe the home improvement project you have in mind.",
          }}
          instructions="You are an expert home renovation consultant. Your goal is to have a natural conversation with the homeowner to understand their project. Ask clarifying questions about the project type, scope, budget, and timeline. Do not ask for their contact information. Be friendly, professional, and helpful."
        />
      </div>
    </div>
  );
}
