import React, { useState } from 'react';
import { Users, Crown, Headphones, Pencil, Check, X, UserX } from 'lucide-react';
import { RoomUser } from '../types/room';

interface RoomUsersProps {
  users: RoomUser[];
  currentUserId?: string;
  isHost?: boolean;
  onUpdateUserName?: (newName: string) => void;
  onKickUser?: (targetSocketId: string) => void;
}

export const RoomUsers: React.FC<RoomUsersProps> = ({ 
  users, 
  currentUserId, 
  isHost, 
  onUpdateUserName, 
  onKickUser 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const currentUser = users.find((u) => u.id === currentUserId);

  const startEditing = () => {
    setEditName(currentUser?.name || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editName.trim();
    if (trimmed && onUpdateUserName) {
      onUpdateUserName(trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full border border-slate-800">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-cyan" />
          <h3 className="font-bold text-base text-white">Listeners</h3>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && onUpdateUserName && !isEditing && (
            <button
              onClick={startEditing}
              className="text-[11px] px-2 py-1 rounded-lg bg-dark-700 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 flex items-center gap-1 transition-all"
              title="Change your display name"
            >
              <Pencil className="h-3 w-3 text-brand-purple" />
              <span>Change Name</span>
            </button>
          )}
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 font-mono text-brand-cyan font-semibold">
            {users.length} Online
          </span>
        </div>
      </div>

      {/* Inline Name Edit Box (If active) */}
      {isEditing && (
        <form onSubmit={handleSaveName} className="mb-3 p-2.5 rounded-xl bg-dark-900/90 border border-brand-purple/40 flex items-center gap-2 animate-fadeIn">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="New display name..."
            autoFocus
            required
            className="flex-1 bg-dark-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
          />
          <button
            type="submit"
            disabled={!editName.trim()}
            className="p-1.5 bg-brand-purple hover:bg-purple-600 disabled:opacity-40 text-white rounded-lg text-xs"
            title="Save Name"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            className="p-1.5 bg-dark-700 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

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
                      <span className="text-[10px] bg-brand-purple/20 text-brand-purple border border-brand-purple/30 px-1.5 py-0.2 rounded font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {user.isHost ? 'Room Host & Controller' : 'Listening in sync'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isYou && !isEditing && onUpdateUserName && (
                  <button
                    onClick={startEditing}
                    className="p-1.5 hover:bg-slate-700/60 text-slate-400 hover:text-brand-purple rounded-lg transition-colors"
                    title="Edit Name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Host Kick Button */}
                {isHost && !user.isHost && !isYou && onKickUser && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Kick ${user.name} from the room?`)) {
                        onKickUser(user.id);
                      }
                    }}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors"
                    title={`Kick ${user.name} from room`}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </button>
                )}

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


