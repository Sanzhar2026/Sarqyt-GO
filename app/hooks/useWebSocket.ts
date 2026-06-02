import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (url: string | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!url) {
            console.log('⚠️ WebSocket URL не предоставлен (нет токена)');
            return;
        }

        console.log('🔌 Подключение WebSocket:', url.substring(0, 80) + '...');
        
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 WebSocket received:', data.type);
                setLastMessage(data);
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [url]);

    const sendMessage = (type: string, payload?: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, ...payload }));
        } else {
            console.warn('WebSocket is not connected');
        }
    };

    return { isConnected, lastMessage, sendMessage };
};