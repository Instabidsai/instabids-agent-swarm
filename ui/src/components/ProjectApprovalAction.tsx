// This component defines a Human-in-the-Loop action. When the backend agent
// calls `requestProjectApproval`, this component will be rendered in the UI,
// pausing the entire workflow until the user clicks "Approve" or "Reject".

import React from 'react';
import { useCopilotAction, ActionRenderProps } from '@copilotkit/react-core';
import { Check, X } from 'lucide-react';

interface ApprovalArgs {
  estimatedCost: number;
  estimatedTimeline: string;
  summary: string;
}

// The UI component that will be rendered for the user to interact with.
const ApprovalDialog = ({ args, status, respond }: ActionRenderProps<ApprovalArgs, boolean>) => {
  // Only render when the agent is waiting for a response.
  if (status !== 'executing') return null;

  return (
    <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg shadow-lg">
      <h3 className="font-bold text-gray-800">Project Plan Approval Required</h3>
      <p className="mt-2 text-gray-600">Please review the AI-generated plan before we proceed to contractor matching.</p>
      <div className="mt-4 p-3 bg-white rounded border">
        <p><strong>Summary:</strong> {args.summary}</p>
        <p><strong>Estimated Cost:</strong> ${args.estimatedCost.toLocaleString()}</p>
        <p><strong>Estimated Timeline:</strong> {args.estimatedTimeline}</p>
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={() => respond(false)}
          className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 flex items-center"
        >
          <X className="h-4 w-4 mr-1" /> Reject
        </button>
        <button
          onClick={() => respond(true)}
          className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 flex items-center"
        >
          <Check className="h-4 w-4 mr-1" /> Approve
        </button>
      </div>
    </div>
  );
};

// The hook that registers the action with the agent system.
export const ProjectApprovalAction = () => {
  useCopilotAction<ApprovalArgs, boolean>({
    name: "requestProjectApproval",
    description: "Pauses the workflow and asks the user to approve the generated project plan.",
    parameters: [
      { name: "summary", type: "string", required: true },
      { name: "estimatedCost", type: "number", required: true },
      { name: "estimatedTimeline", type: "string", required: true },
    ],
    renderAndWaitForResponse: ApprovalDialog,
  });

  return null;
};
