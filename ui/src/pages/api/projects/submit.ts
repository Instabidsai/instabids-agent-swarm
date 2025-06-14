import type { NextApiRequest, NextApiResponse } from 'next'

interface ProjectSubmission {
  project_id: string
  contact_info: {
    first_name: string
    last_name: string
    email: string
    phone: string
    zip_code: string
    city: string
    state: string
  }
  project_details: {
    raw_description: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const submission: ProjectSubmission = req.body

    // For demo purposes, we'll simulate submission
    // In production, this would connect to your FastAPI backend
    const response = {
      message: 'Project submitted to the agent swarm.',
      projectId: submission.project_id,
      messageId: `msg_${Date.now()}`
    }

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    res.status(202).json(response)
  } catch (error) {
    console.error('Error submitting project:', error)
    res.status(500).json({ 
      detail: 'Failed to process project submission.' 
    })
  }
}