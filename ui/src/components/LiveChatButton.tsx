// ui/src/components/LiveChatButton.tsx
import React from 'react';
import { useLiveChat, ConnectionStatus } from '@/hooks/useLiveChat';

interface LiveChatButtonProps {
    projectId: string;
}

export const LiveChatButton: React.FC<LiveChatButtonProps> = ({ projectId }) => {
    const { status, connect, disconnect } = useLiveChat(projectId);

    const isChatting = status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING;

    const buttonText = () => {
        switch (status) {
            case ConnectionStatus.CONNECTING: return 'Connecting...';
            case ConnectionStatus.CONNECTED: return 'End Live Chat';
            default: return 'Start Live Voice Chat';
        }
    };
    
    const buttonClass = isChatting
        ? "bg-red-600 hover:bg-red-700"
        : "bg-green-600 hover:bg-green-700";

    return (
        <div className="text-center p-4">
            <button
                onClick={isChatting ? disconnect : connect}
                className={`w-full p-4 rounded-md font-bold text-lg text-white transition duration-300 ${buttonClass}`}
            >
                {buttonText()}
            </button>
            {isChatting && (
                 <div className="mt-4 flex items-center justify-center text-gray-600">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-2"></div>
                    <span>Live conversation is active</span>
                </div>
            )}
        </div>
    );
};