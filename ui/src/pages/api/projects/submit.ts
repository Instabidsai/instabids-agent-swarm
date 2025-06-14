import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method === 'POST') {
    // In a real app, you would publish this to Redis Streams
    console.log('Received project submission:', req.body);
    res.status(200).json({ message: "Project submitted successfully to the agent swarm." });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}