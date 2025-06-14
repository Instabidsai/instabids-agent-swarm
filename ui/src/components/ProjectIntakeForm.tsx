'use client';
import React, { useState } from 'react';

export const ProjectIntakeForm = () => {
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('Submitting...');
    
    // In a real app, this would call the API route
    // For this example, we'll just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatus(`Project with description "${description}" submitted successfully!`);
    setDescription('');
  };

  return (
    <div className="p-4 border rounded-lg my-4">
      <h2 className="text-lg font-bold mb-2">Submit a New Project</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Describe your project..."
          required
        />
        <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md">
          Submit
        </button>
      </form>
      {status && <p className="mt-2 text-green-600">{status}</p>}
    </div>
  );
};