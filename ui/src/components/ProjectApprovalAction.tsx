// This component defines a Human-in-the-Loop action. This final version
// fixes the TypeScript error by removing the incorrect 'Parameter' import and
// correctly defining the parameters array inline.

import React from 'react';
// CORRECTED: The non-existent 'Parameter' type has been removed from the import.
import { useCopilotAction, ActionRenderPropsWait } from '@copilotkit/react-core';
import type { Parameter, MappedParameterTypes } from '@copilotkit/shared';
import { Check, X } from 'lucide-react';

const parameters = [
  { name: "summary", type: "string", description: "A brief summary of the project plan.", required: true },
  { name: "estimatedCost", type: "number", description: "The estimated cost of the project.", required: true },
  { name: "estimatedTimeline", type: "string", description: "The estimated timeline for project completion.", required: true },
] as const satisfies Parameter[];

type ApprovalArgs = MappedParameterTypes<typeof parameters>;

const ApprovalDialog = (props: ActionRenderPropsWait<typeof parameters>) => {
  if (props.status !== 'executing') return <></>;

  return (
    <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg shadow-lg">
      <h3 className="font-bold text-gray-800">Project Plan Approval Required</h3>
      <p className="mt-2 text-gray-600">Please review the AI-generated plan before we proceed to contractor matching.</p>
      <div className="mt-4 p-3 bg-white rounded border">
        <p><strong>Summary:</strong> {props.args.summary}</p>
        <p><strong>Estimated Cost:</strong> ${props.args.estimatedCost.toLocaleString()}</p>
        <p><strong>Estimated Timeline:</strong> {props.args.estimatedTimeline}</p>
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={() => props.respond && props.respond(false)}
          className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 flex items-center"
        >
          <X className="h-4 w-4 mr-1" /> Reject
        </button>
        <button
          onClick={() => props.respond && props.respond(true)}
          className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 flex items-center"
        >
          <Check className="h-4 w-4 mr-1" /> Approve
        </button>
      </div>
    </div>
  );
};

export const ProjectApprovalAction = () => {
  useCopilotAction<typeof parameters>({
    name: "requestProjectApproval",
    description: "Pauses the workflow and asks the user to approve the generated project plan.",
    parameters,
    renderAndWaitForResponse: ApprovalDialog,
  });

  return null;
};