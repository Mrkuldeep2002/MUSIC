import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Crown } from 'lucide-react';
import { ChatMessage } from '../types/room';

interface ChatProps {
  messages: ChatMessage[];
  currentUserId?: string;
  onSendMessage: (msg: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, currentUserId, onSendMessage }) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full border border-slate-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
        <MessageSquare className="h-5 w-5 text-brand-purple" />
        <h3 className="font-bold text-base text-white">Room Chat</h3>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[320px] pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-8">
            <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">No messages yet. Say hi to the room!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="text-center py-1">
                  <span className="text-[11px] font-medium text-slate-400 bg-dark-800/80 px-2.5 py-1 rounded-full border border-slate-700/40">
                    {msg.message}
                  </span>
                </div>
              );
            }

            const isYou = msg.senderId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold text-slate-300">
                    {isYou ? 'You' : msg.senderName}
                  </span>
                  {msg.isHost && (
                    <span title="Host">
                      <Crown className="h-3 w-3 text-amber-400" />
                    </span>
                  )}
                  <span className="text-[9px] text-slate-500 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words shadow-sm ${
                    isYou
                      ? 'bg-gradient-to-r from-brand-purple to-purple-600 text-white rounded-tr-none'
                      : 'bg-dark-700 text-slate-100 rounded-tl-none border border-slate-700/50'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send a message..."
          maxLength={500}
          className="flex-1 bg-dark-800 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2 rounded-xl bg-brand-purple hover:bg-purple-600 disabled:opacity-40 text-white transition-all shadow-md shadow-brand-purple/20 flex items-center justify-center"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
