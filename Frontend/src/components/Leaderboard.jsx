import React, { useState, useEffect, useRef } from 'react';
import { adminFetch } from '../utils/adminApi';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [error, setError] = useState(null);
  const isMounted = useRef(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

  useEffect(() => {
    isMounted.current = true;
    fetchLeaderboard();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchLeaderboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await adminFetch(`${API_BASE}/admin/leaderboard`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (isMounted.current) {
        setLeaderboard(data.leaderboard || []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('[Leaderboard] Error fetching data:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load leaderboard data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Dynamic gradient generator for vertical sticks by rank
  const getStickGradient = (index) => {
    if (index === 0) return 'bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 border-amber-300 shadow-amber-200';
    if (index === 1) return 'bg-gradient-to-t from-slate-600 via-slate-500 to-slate-400 border-slate-300 shadow-slate-200';
    if (index === 2) return 'bg-gradient-to-t from-amber-800 via-amber-700 to-amber-600 border-amber-500 shadow-amber-300';
    
    const gradients = [
      'bg-gradient-to-t from-blue-600 to-indigo-400 border-blue-300 shadow-blue-100',
      'bg-gradient-to-t from-emerald-600 to-teal-400 border-emerald-300 shadow-emerald-100',
      'bg-gradient-to-t from-purple-600 to-pink-400 border-purple-300 shadow-purple-100',
      'bg-gradient-to-t from-cyan-600 to-blue-400 border-cyan-300 shadow-cyan-100'
    ];
    return gradients[(index - 3) % gradients.length];
  };

  // Rank badge styling
  const getRankBadge = (index) => {
    if (index === 0) return { label: '👑 #1', bg: 'bg-yellow-400 text-yellow-950 font-bold border-amber-300 ring-2 ring-yellow-300 animate-pulse' };
    if (index === 1) return { label: '🥈 #2', bg: 'bg-slate-200 text-slate-900 font-bold border-slate-300' };
    if (index === 2) return { label: '🥉 #3', bg: 'bg-amber-100 text-amber-900 font-bold border-amber-300' };
    return { label: `#${index + 1}`, bg: 'bg-gray-100 text-gray-700 border-gray-200 font-medium' };
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-200 border-t-primary-800"></div>
        <p className="mt-4 text-sm font-semibold text-text-secondary">Loading Election Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-primary-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-900 tracking-tight">
              Live Position Leaderboard
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Data
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Real-time vote standings for each candidate position. Hover on profile pictures to view candidate details.
          </p>
        </div>

        {/* Action / Refresh controls */}
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-text-muted hidden md:inline">
              Updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-primary-800 hover:bg-primary-900 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 active:scale-95 cursor-pointer"
            title="Refresh Leaderboard"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-700 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => fetchLeaderboard(true)}
            className="text-xs font-semibold underline hover:text-red-900"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Grid of Position Leaderboards (2 per row on large width screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {leaderboard.map((pos) => {
          const maxVotes = Math.max(...pos.candidates.map((c) => c.voteCount), 1);

          return (
            <div
              key={pos.positionId || pos.positionName}
              className="bg-white rounded-2xl shadow-sm border border-primary-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Position Card Header */}
              <div className="p-4 sm:p-5 border-b border-primary-100 bg-gradient-to-r from-gray-50 via-white to-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    {pos.displayName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                    <span className="bg-primary-50 text-primary-800 px-2 py-0.5 rounded-md font-medium border border-primary-100">
                      {pos.totalCandidates} Candidate{pos.totalCandidates !== 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-medium border border-emerald-100">
                      {pos.totalVotes} Total Vote{pos.totalVotes !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Leaderboard
                  </span>
                </div>
              </div>

              {/* Stick Canvas / Chart Area */}
              <div className="p-4 sm:p-6 flex-1 flex flex-col justify-end bg-slate-50/50">
                {pos.candidates.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-sm text-gray-400 italic">
                    No approved candidates registered for this position yet.
                  </div>
                ) : (
                  <div className="relative h-64 sm:h-72 w-full pt-16 pb-4 flex items-end justify-around gap-2 sm:gap-4 border-b-2 border-slate-200">
                    {pos.candidates.map((candidate, idx) => {
                      const heightPercent =
                        pos.totalVotes > 0 || maxVotes > 0
                          ? Math.max((candidate.voteCount / maxVotes) * 100, 12)
                          : 12;

                      const rankBadge = getRankBadge(idx);
                      const stickGradient = getStickGradient(idx);

                      return (
                        <div
                          key={candidate.candidateId}
                          className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[90px] cursor-pointer transition-all duration-300"
                        >
                          {/* Hover Tooltip - Appears ONLY when admin hovers over candidate stick / profile picture */}
                          <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:-translate-y-1 pointer-events-none group-hover:pointer-events-auto z-30 w-44 sm:w-48 bg-slate-900 text-white rounded-xl p-3 shadow-xl text-center border border-slate-700 text-xs left-1/2 -translate-x-1/2">
                            <div className="font-bold text-sm text-white truncate">
                              {candidate.name}
                            </div>
                            <div className="text-slate-300 text-[11px] font-mono mt-0.5">
                              USN: {candidate.usn}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center text-[11px]">
                              <span className="text-slate-400">Votes:</span>
                              <span className="font-bold text-amber-400 text-xs">
                                {candidate.voteCount} ({candidate.percentage}%)
                              </span>
                            </div>
                            {/* Tooltip Down Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                          </div>

                          {/* Profile Picture Container at Top of Stick */}
                          <div className="relative mb-2 z-10 flex flex-col items-center">
                            {/* Rank Badge above image */}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border shadow-xs mb-1 whitespace-nowrap ${rankBadge.bg}`}
                            >
                              {rankBadge.label}
                            </span>

                            {/* Candidate Image */}
                            <div
                              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-200 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                                idx === 0 ? 'ring-4 ring-yellow-400/50 shadow-yellow-200' : ''
                              }`}
                            >
                              {candidate.photoUrl ? (
                                <img
                                  src={candidate.photoUrl}
                                  alt={candidate.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = ''; // trigger fallback initials
                                  }}
                                />
                              ) : (
                                <span className="font-bold text-gray-600 text-xs sm:text-sm">
                                  {candidate.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Vertical Stick / Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-8 sm:w-12 rounded-t-lg transition-all duration-700 ease-out border-t border-x shadow-md flex items-end justify-center pb-2 relative group-hover:brightness-110 ${stickGradient}`}
                          >
                            {/* Vote count text inside stick */}
                            <span className="text-[11px] sm:text-xs font-bold text-white shadow-sm drop-shadow-md">
                              {candidate.voteCount}
                            </span>
                          </div>

                          {/* Vote count label at bottom of stick */}
                          <div className="mt-2 text-center">
                            <span className="text-[11px] font-semibold text-gray-500 group-hover:text-primary-800">
                              {candidate.voteCount} {candidate.voteCount === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer hint */}
                <div className="mt-3 text-center text-[11px] text-text-muted italic">
                  💡 Tip: Hover over any candidate's profile picture to reveal their name & details.
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && !error && (
        <div className="bg-white p-12 rounded-2xl border text-center text-gray-500">
          No positions found in the system.
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
