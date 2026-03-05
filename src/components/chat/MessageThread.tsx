'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Message } from '@/lib/database.types';

interface MessageThreadProps {
  requestId: string;
  onNewMessage?: (message: Message) => void;
}

export function MessageThread({ requestId, onNewMessage }: MessageThreadProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/v1/requests/${requestId}/messages`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('Нямате достъп до този чат');
        } else {
          setError('Грешка при зареждане на съобщения');
        }
        return;
      }

      const data = await response.json();
      const newMessages = data.data || [];

      // Check for new messages
      if (messages.length > 0 && newMessages.length > messages.length) {
        const lastNewMessage = newMessages[newMessages.length - 1];
        if (lastNewMessage.sender_id !== profile?.id) {
          onNewMessage?.(lastNewMessage);
        }
      }

      setMessages(newMessages);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Грешка при зареждане на съобщения');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [requestId]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [messages, profile?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Зареждане на съобщения...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">Нямате съобщения</p>
        </div>
      ) : (
        messages.map((message) => {
          const isOwn = message.sender_id === profile?.id;

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  isOwn
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm break-words">{message.body}</p>
                <div className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-600'}`}>
                  {new Date(message.created_at).toLocaleTimeString('bg-BG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {message.read_by && message.read_by.length > 0 && !isOwn && (
                    <span className="ml-2">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
