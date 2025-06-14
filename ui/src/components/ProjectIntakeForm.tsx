// ui/src/components/ProjectIntakeForm.tsx
import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ProjectIntakeForm = () => {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setStatus('uploading');
        const file = files[0];
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `public/${fileName}`;

        try {
            const { data, error: uploadError } = await supabase.storage
                .from('project_media') // The bucket name from SETUP ME
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get the public URL of the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('project_media')
                .getPublicUrl(filePath);

            setUploadedFileUrls(prev => [...prev, publicUrl]);
            setStatus('idle');
        } catch (err: any) {
            setError('File upload failed. Please try again.');
            setStatus('error');
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('submitting');
        setError(null);
        const formData = new FormData(event.currentTarget);
        const submissionData = {
            project_id: `proj_${new Date().getTime()}`,
            contact_info: {
                first_name: formData.get('first_name') as string,
                last_name: formData.get('last_name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                zip_code: formData.get('zip_code') as string,
                city: "Anytown", state: "AS",
            },
            project_details: { 
                raw_description: formData.get('raw_description') as string,
                image_urls: uploadedFileUrls // Include uploaded images
            }
        };

        try {
            const response = await fetch('/api/projects/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });
            if (!response.ok) throw new Error((await response.json()).detail || 'Failed to submit.');
            const result = await response.json();
            setProjectId(result.projectId);
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setError(err.message);
        }
    };

    if (status === 'success') {
        return (
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-2xl font-semibold text-green-800">Thank You!</h3>
                <p className="mt-2 text-gray-700">Your project (ID: {projectId}) has been submitted to our agent swarm. You can monitor their real-time activity to the right.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800">1. Describe Your Project</h3>
            </div>
            <textarea name="raw_description" rows={8} placeholder="e.g., 'I want to remodel my master bathroom. This includes a walk-in shower, new double vanity, and new floor tiles.'" required className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition"/>
            
            <h3 className="text-xl font-semibold text-gray-700">Project Photos (Optional)</h3>
            <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:underline">
                    {status === 'uploading' ? 'Uploading...' : 'Upload an Image'}
                </button>
                {uploadedFileUrls.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600">
                        <p>{uploadedFileUrls.length} image(s) attached.</p>
                    </div>
                )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 text-center">2. Your Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="first_name" type="text" placeholder="First Name" required className="p-3 border rounded-md"/>
                <input name="last_name" type="text" placeholder="Last Name" required className="p-3 border rounded-md"/>
                <input name="email" type="email" placeholder="Email Address" required className="p-3 border rounded-md"/>
                <input name="phone" type="tel" placeholder="Phone Number" required className="p-3 border rounded-md"/>
            </div>
            <input name="zip_code" type="text" placeholder="Project Zip Code" required className="w-full p-3 border rounded-md"/>
            {status === 'error' && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            <button type="submit" disabled={status === 'submitting'} className="w-full bg-blue-600 text-white p-4 rounded-md font-bold text-lg hover:bg-blue-700 transition disabled:bg-gray-400">
                {status === 'submitting' ? 'Submitting to Swarm...' : 'Activate Agent Swarm'}
            </button>
        </form>
    );
};
