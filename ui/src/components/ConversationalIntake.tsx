"use client";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

// Define the props interface to accept the onAnalysisUpdate function
interface ConversationalIntakeProps {
  onAnalysisUpdate: (analysis: any) => void;
}

export const ConversationalIntake = ({ onAnalysisUpdate }: ConversationalIntakeProps) => {
  return (
    <CopilotKit
      publicApiKey={process.env.NEXT_PUBLIC_COPILOT_CLOUD_API_KEY}
      // The following is a hack to make the sample app work
      // with the free tier of Copilot Cloud.
      // The correct way to do this is to pass a threadId
      // to the CopilotKit component.
      // threadId={thread.id}
      // We are using a random thread id for each user session
      // so that the context is not shared between users.
      // This is not a recommended practice for production apps.
      threadId={Math.random().toString()}
    >
      <CopilotPopup
        instructions={
          "Please greet the user and then ask them to describe the project they have in mind."
        }
        defaultOpen={true}
        labels={{
          title: "Your AI Project Assistant",
          initial:
            "Hello! I'm here to help you get started. Please describe the home improvement project you have in mind.",
        }}
        onInProgress={async (inProgress) => {
          if (!inProgress) {
            // When the AI is done, you can do something with the analysis
            // For now, we'll just log it to the console
            // console.log("Analysis complete:", analysis);
          }
        }}
      />
    </CopilotKit>
  );
};