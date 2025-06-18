import React, { useState, useEffect, useRef } from 'react';
import { useLivekit } from '../hooks/useLivekit';
import { LocalVideoTrack } from 'livekit-client';
import { useAgentSwarmSocket, type AgentSwarmSocketState } from '../hooks/useAgentSwarmSocket'; // CORRECTED IMPORT

const LIVEKIT_SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7881';

interface LiveVideoChatProps {
  projectId: string;
  userId: string;
}

const VideoComponent = ({ track }: { track: LocalVideoTrack }) => {
  const videoEl = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoEl.current) {
      track.attach(videoEl.current);
    }
    return () => {
      track.detach();
    };
  }, [track]);

  return <video ref={videoEl} width="100%" height="auto" autoPlay muted />;
};

export const LiveVideoChat: React.FC<LiveVideoChatProps> = ({ projectId, userId }) => {
  const [token, setToken] = useState<string>('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string>('');
  
  const { lastMessage }: AgentSwarmSocketState = useAgentSwarmSocket(projectId);

  const { connectToRoom, disconnectFromRoom, isConnected, localVideoTrack } = useLivekit({
    serverUrl: LIVEKIT_SERVER_URL,
    token: token,
    roomName: projectId,
  });

  const getToken = async () => {
    try {
      const response = await fetch(`/api/livekit/token?room=${projectId}&user=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch token');
      const data = await response.json();
      setToken(data.token);
    } catch (e) {
      console.error(e);
      alert('Could not start live session. Please try again later.');
    }
  };

  const handleStartSession = async () => {
    setSessionStarted(true);
    await getToken();
  };

  useEffect(() => {
    if (sessionStarted && token) {
      connectToRoom();
    }
  }, [sessionStarted, token, connectToRoom]);

  useEffect(() => {
    if (lastMessage && lastMessage.stream === 'ai:agent_response' && lastMessage.data.text_response) {
      const responseText = lastMessage.data.text_response;
      setAgentResponse(responseText);
      
      const utterance = new SpeechSynthesisUtterance(responseText);
      speechSynthesis.speak(utterance);
    }
  }, [lastMessage]);

  return (
    <div className="live-video-chat-container p-4 border rounded-lg bg-gray-50 shadow-md">
      <div className="video-wrapper relative mb-4 rounded-md overflow-hidden">
        {isConnected && localVideoTrack ? (
          <VideoComponent track={localVideoTrack} />
        ) : (
          <div className="placeholder bg-gray-200 aspect-video flex items-center justify-center">
            <p className="text-gray-500">Your video will appear here</p>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
          <p className="font-bold text-sm">Agent Response:</p>
          <p className="text-lg">{agentResponse || "Waiting for agent..."}</p>
        </div>
      </div>
      
      {!isConnected ? (
        <button
          onClick={handleStartSession}
          disabled={sessionStarted}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {sessionStarted ? 'Connecting...' : 'Start Walkthrough'}
        </button>
      ) : (
        <button
          onClick={disconnectFromRoom}
          className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          End Session
        </button>
      )}
    </div>
  );
};
