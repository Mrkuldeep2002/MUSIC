import React, { useState } from 'react';
import { Music2, Copy, Check, Users, LogOut } from 'lucide-react';
import { RoomState } from '../types/room';

interface HeaderProps {
  roomState: RoomState | null;
  onLeaveRoom: () => void;
}

export const Header: React.FC<HeaderProps> = ({ roomState, onLeaveRoom }) => {
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    if (!roomState) return;
    const inviteUrl = `${window.location.origin}/?room=${roomState.roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center shadow-lg shadow-brand-purple/20">
            <Music2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Sync<span className="text-brand-purple">Tune</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium -mt-1">Real-Time Music Room</p>
          </div>
        </div>

        {/* Room Information (If inside room) */}
        {roomState && (
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Room Code Badge */}
            <div className="flex items-center gap-2 bg-dark-800 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider hidden sm:inline">Room:</span>
              <span className="font-mono font-bold text-brand-cyan tracking-widest text-sm">{roomState.roomId}</span>
              <button
                onClick={copyInviteLink}
                className="ml-1 p-1 hover:bg-slate-700/60 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs"
                title="Copy Invite Link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden md:inline">{copied ? 'Copied' : 'Link'}</span>
              </button>
            </div>

            {/* Connected User Count */}
            <div className="flex items-center gap-1.5 bg-dark-800/80 border border-slate-700/40 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300">
              <Users className="h-3.5 w-3.5 text-brand-purple" />
              <span>{roomState.users.length}</span>
            </div>

            {/* Leave Room Button */}
            <button
              onClick={onLeaveRoom}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl transition-all flex items-center gap-1 text-xs font-medium"
              title="Leave Room"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
