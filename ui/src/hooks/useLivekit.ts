// This new hook encapsulates all the client-side logic for interacting with the LiveKit media server.
//
// Key Responsibilities:
// - Requesting camera and microphone permissions from the user.
// - Generating a secure connection token by making a request to our backend.
// - Establishing and managing the WebRTC connection to the LiveKit server.
// - Publishing the user's local audio and video tracks to the room.
// - Handling connection state changes (e.g., connected, disconnected, reconnecting).

import { useState, useEffect, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  LocalVideoTrack,
  LocalAudioTrack,
  RoomOptions,
  createLocalVideoTrack,
  createLocalAudioTrack
} from 'livekit-client';

export interface UseLivekitProps {
  serverUrl: string;
  token: string;
  roomName: string;
}

export function useLivekit({ serverUrl, token, roomName }: UseLivekitProps) {
  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | undefined>(undefined);

  const connectToRoom = useCallback(async () => {
    if (!token || !serverUrl) return;

    const roomOptions: RoomOptions = {
      adaptiveStream: true,
      dynacast: true,
    };

    const newRoom = new Room(roomOptions);

    newRoom
      .on(RoomEvent.Connected, () => setIsConnected(true))
      .on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setRoom(undefined);
        localVideoTrack?.stop();
        localAudioTrack?.stop();
      });

    try {
      await newRoom.connect(serverUrl, token);
      
      const audioTrack = await createLocalAudioTrack();
      const videoTrack = await createLocalVideoTrack();
      
      await newRoom.localParticipant.publishTrack(audioTrack);
      await newRoom.localParticipant.publishTrack(videoTrack);

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      setRoom(newRoom);

    } catch (error) {
      console.error("Failed to connect to LiveKit room", error);
    }
  }, [token, serverUrl, localVideoTrack, localAudioTrack]);

  const disconnectFromRoom = useCallback(() => {
    room?.disconnect();
  }, [room]);

  useEffect(() => {
    return () => {
      room?.disconnect();
    };
  }, [room]);

  return {
    room,
    isConnected,
    connectToRoom,
    disconnectFromRoom,
    localVideoTrack,
    localAudioTrack,
  };
}