import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  // Debounced search trigger (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search YouTube for songs, artists, or music videos..."
          className="w-full bg-dark-800 border border-slate-700/80 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all shadow-inner"
        />
        {isLoading ? (
          <Loader2 className="absolute right-4 h-5 w-5 text-brand-purple animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 p-1 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </form>
  );
};
