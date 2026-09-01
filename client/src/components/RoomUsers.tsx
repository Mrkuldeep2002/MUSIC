import React from 'react';
import { Users, Crown, Headphones, Radio } from 'lucide-react';
import { RoomUser } from '../types/room';

interface RoomUsersProps {
  users: RoomUser[];
  currentUserId?: string;
}

export const RoomUsers: React.FC<RoomUsersProps> = ({ users, currentUserId }) => {
  return (
    <div className="glass-panel p-4 flex flex-col h-full border border-slate-800">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-cyan" />
          <h3 className="font-bold text-base text-white">Listeners</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 font-mono text-brand-cyan font-semibold">
          {users.length} Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px]">
        {users.map((user) => {
          const isYou = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                user.isHost
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : isYou
                  ? 'bg-brand-purple/10 border-brand-purple/30'
                  : 'bg-dark-800/60 border-slate-700/30'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-dark-900 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-dark-900"></span>
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                    {isYou && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {user.isHost ? 'Room Host & Controller' : 'Listening in sync'}
                  </p>
                </div>
              </div>

              <div>
                {user.isHost ? (
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 block" title="Room Host">
                    <Crown className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="p-1.5 rounded-lg bg-dark-700 text-slate-400 block" title="Listener">
                    <Headphones className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
