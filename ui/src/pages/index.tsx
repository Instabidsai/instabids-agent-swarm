import { useState } from 'react';
import { ConversationalIntake } from '@/components/ConversationalIntake';
import { LiveIntakeAnalysis } from '@/components/LiveIntakeAnalysis';

export default function Home() {
  const [analysis, setAnalysis] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold leading-tight text-gray-900">InstaBids Agent Swarm</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: Conversational Intake */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">1. Describe Your Project</h2>
            <p className="text-sm text-gray-600 mb-4">
              Start by telling our AI assistant about your project. You can type, or soon, use
              your voice and camera. The more details you provide, the better our agent swarm
              can understand your needs.
            </p>
            <ConversationalIntake onAnalysisUpdate={setAnalysis} />
          </div>

          {/* Column 2: Live Analysis */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">2. Live AI Analysis</h2>
            <p className="text-sm text-gray-600 mb-4">
              As you chat with our assistant, our agent swarm will analyze your needs in real-
              time. Watch as it builds a structured understanding of your project below.
            </p>
            <LiveIntakeAnalysis analysis={analysis} />
          </div>
        </div>
      </main>
    </div>
  );
}