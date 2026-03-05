'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Send } from 'lucide-react';

interface MessageInputProps {
  requestId: string;
  requestStatus: string;
  onMessageSent?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  requestId,
  requestStatus,
  onMessageSent,
  disabled = false,
}: MessageInputProps) {
  const { profile } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSendMessage = () => {
    // Customer can always send messages
    if (profile?.role === 'customer') {
      return true;
    }

    // Provider can only send messages if request is assigned or later
    if (profile?.role === 'provider' && requestStatus !== 'open') {
      return true;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) {
      setError('Съобщението не може да бъде празно');
      return;
    }

    if (!canSendMessage()) {
      setError('Не можете да изпращате съобщения в този момент');
      return;
    }

    try {
      setSending(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Неавторизиран достъп');
        return;
      }

      const response = await fetch(`/api/v1/requests/${requestId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ body: messageText }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Грешка при изпращане на съобщение');
        return;
      }

      setMessageText('');
      onMessageSent?.();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Грешка при изпращане на съобщение');
    } finally {
      setSending(false);
    }
  };

  if (!canSendMessage()) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          {profile?.role === 'provider'
            ? 'Можете да изпращате съобщения след като заявката е възложена'
            : 'Не можете да изпращате съобщения в този момент'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Напишете съобщение..."
          disabled={sending || disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={sending || !messageText.trim() || disabled}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Изпращане...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Изпрати
            </>
          )}
        </button>
      </div>
    </form>
  );
}
