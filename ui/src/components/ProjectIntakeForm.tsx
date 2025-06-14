'use client';
import React, { useState } from 'react';

// Define the type for the props the component will accept
interface ProjectIntakeFormProps {
  onSubmissionSuccess: (projectId: string) => void;
}

// Update the component to accept the props
export const ProjectIntakeForm: React.FC<ProjectIntakeFormProps> = ({ onSubmissionSuccess }) => {
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('Submitting project to the agent swarm...');

    try {
      // In a real app, this would call the API route
      // const response = await fetch('/api/projects/submit', { ... });
      // const data = await response.json();
      
      // For now, we'll simulate a successful submission and get a project ID
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockProjectId = `proj_${Date.now()}`;

      setStatus(`Project submitted! Agent swarm is now active.`);
      
      // This is the crucial step: call the function passed down from the parent page
      onSubmissionSuccess(mockProjectId);

    } catch (error) {
        setStatus('Submission failed. Please try again.');
        console.error("Submission error:", error);
    }
  };

  return (
    <div className="p-4 border rounded-lg my-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Submit a New Project</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Describe your project in detail. For example: 'I need to remodel my master bathroom. This includes replacing the tile, installing a new vanity, and upgrading the shower fixtures.'"
          required
          rows={5}
        />
        <button 
          type="submit" 
          className="mt-4 w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={status === 'Submitting project to the agent swarm...'}
        >
          {status === 'Submitting project to the agent swarm...' ? 'Processing...' : 'Submit to Agent Swarm'}
        </button>
      </form>
      {status && status !== 'Submitting project to the agent swarm...' && (
        <p className="mt-4 text-center text-green-700">{status}</p>
      )}
    </div>
  );
};