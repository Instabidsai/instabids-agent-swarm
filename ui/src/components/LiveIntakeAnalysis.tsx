"use client";
import React from "react";

// Define the props interface to accept the analysis object
interface LiveIntakeAnalysisProps {
  analysis: any;
}

const LiveIntakeAnalysis = ({ analysis }: LiveIntakeAnalysisProps) => {
  // If there's no analysis data yet, show a placeholder.
  if (!analysis) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg h-96 animate-pulse">
        <p className="text-gray-500">Waiting for project details...</p>
      </div>
    );
  }

  // Once we have analysis data, display it.
  return (
    <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-auto">
      <pre className="text-sm whitespace-pre-wrap">
        {JSON.stringify(analysis, null, 2)}
      </pre>
    </div>
  );
};

export default LiveIntakeAnalysis;