// This API route generates a secure, short-lived token that allows a user
// to connect to a specific LiveKit room. This prevents unauthorized access
// to the media server.

import { NextApiRequest, NextApiResponse } from 'next';
import { AccessToken } from 'livekit-server-sdk';

const livekitHost = 'http://localhost:7880'; // Should be from env vars
const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const roomName = req.query.room as string;
  const participantName = req.query.user as string;

  if (!roomName || !participantName) {
    return res.status(400).json({ error: 'Missing room or user parameter' });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });

  at.addGrant({ roomJoin: true, room: roomName });

  res.status(200).json({ token: at.toJwt() });
}
