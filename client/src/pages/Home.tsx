import React, { useState, useEffect } from 'react';
import { Music2, Radio, Play, Users, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Toast } from '../components/Toast';

interface HomeProps {
  errorMessage?: string | null;
  toast?: { message: string; type: 'info' | 'success' | 'warning' } | null;
  onCreateRoom: (userName?: string) => void;
  onJoinRoom: (roomId: string, userName?: string) => void;
}

export const Home: React.FC<HomeProps> = ({ errorMessage, toast, onCreateRoom, onJoinRoom }) => {
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('wesync_user_name') || localStorage.getItem('synctune_user_name') || '';
  });
  const [roomCode, setRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Auto detect invite link query param e.g. /?room=ABCD12
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setShowJoinModal(true);
    }
  }, []);

  const handleUserNameChange = (val: string) => {
    setUserName(val);
    if (val.trim()) {
      localStorage.setItem('wesync_user_name', val.trim());
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('wesync_user_name', userName.trim());
    }
    onCreateRoom(userName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('wesync_user_name', userName.trim());
    }
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase(), userName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Glowing Lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-purple/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-brand-pink/15 rounded-full blur-[128px] pointer-events-none" />

      {/* Top Header Navbar */}
      <header className="px-6 lg:px-12 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center shadow-lg shadow-brand-purple/30">
            <Music2 className="h-6 w-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            We<span className="text-brand-purple">Sync</span>
          </span>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 flex flex-col items-center justify-center text-center py-12 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-xs font-semibold mb-8 animate-pulse">
          <Sparkles className="h-4 w-4" />
          <span>Real-Time Synchronized Music & Video Rooms</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight mb-6">
          Listen to YouTube Music <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-clip-text text-transparent">
            Together in Perfect Sync
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          Create a room, search YouTube, queue your favorite songs, and enjoy seamless frame-synchronized playback with friends anywhere in the world.
        </p>

        {/* User Display Name Setup */}
        <div className="w-full max-w-md bg-dark-800/90 border border-slate-800 p-6 rounded-3xl shadow-2xl mb-10 text-left backdrop-blur-md">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Your Display Name (Optional)
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => handleUserNameChange(e.target.value)}
            placeholder="e.g. Rahul, Aman, DJ Sonic"
            className="w-full bg-dark-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 mb-6 transition-all"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCreate}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-purple to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-brand-purple/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Radio className="h-4 w-4" />
              <span>Create Room</span>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full py-3.5 px-4 bg-dark-700 hover:bg-dark-600 border border-slate-700/60 text-slate-100 font-bold rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Users className="h-4 w-4 text-brand-cyan" />
              <span>Join Room</span>
            </button>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl w-full mt-6">
          <div className="glass-panel p-5 border border-slate-800/80">
            <div className="h-10 w-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-4">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">Sub-Second Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authoritative server timestamps automatically keep all listeners synchronized down to milliseconds.
            </p>
          </div>

          <div className="glass-panel p-5 border border-slate-800/80">
            <div className="h-10 w-10 rounded-xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mb-4">
              <Play className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">YouTube Data API</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Search any YouTube music video directly inside the app and queue tracks seamlessly.
            </p>
          </div>

          <div className="glass-panel p-5 border border-slate-800/80">
            <div className="h-10 w-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">Host Controls & Chat</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Host manages playback and queue while everyone chats and enjoys music in real-time.
            </p>
          </div>
        </div>
      </main>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-slate-700/80 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-1">Join a Listening Room</h3>
            <p className="text-xs text-slate-400 mb-4">Enter the 6-character room code provided by your host.</p>

            {/* Error Alert Banner */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCD12"
                  maxLength={6}
                  required
                  className="w-full bg-dark-900 border border-slate-700/80 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-brand-cyan uppercase placeholder-slate-600 focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-slate-300 font-semibold rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!roomCode.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-brand-purple to-brand-pink hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-1.5"
                >
                  <span>Join Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/60 text-center text-xs text-slate-500 z-10">
        WeSync • Powered by Official YouTube IFrame Player API & Socket.IO
      </footer>
    </div>
  );
};
