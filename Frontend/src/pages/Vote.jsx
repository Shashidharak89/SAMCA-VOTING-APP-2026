import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const API_URL = `${API_BASE}/vote`;

export default function Vote({ userEmail, token, onVoted }) {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState({});
  const [expandedPositions, setExpandedPositions] = useState({});
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  
  const navigate = useNavigate();
  const positionRefs = useRef({});

  useEffect(() => {
    setFetching(true);
    fetch(`${API_URL}/positions-candidates`)
      .then((res) => res.json())
      .then((data) => {
        const posList = data.positions || [];
        const candList = data.candidates || [];
        setPositions(posList);
        setCandidates(candList);

        // Initially, expand all position sections
        const initialExpanded = {};
        posList.forEach((pos) => {
          initialExpanded[pos] = true;
        });
        setExpandedPositions(initialExpanded);
        setFetching(false);
      })
      .catch((err) => {
        console.error("[Vote] Failed to fetch positions and candidates:", err);
        setMessage("Failed to load election data. Please check connection.");
        setFetching(false);
      });
  }, []);

  const handleVoteChange = (position, candidateId) => {
    // 1. Record selection
    setVotes((prev) => ({ ...prev, [position]: candidateId }));

    // 2. Clear validation error for this position if present
    if (validationErrors[position]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[position];
        return next;
      });
    }

    // 3. Automatically minimize / collapse this role section after selecting a candidate
    setExpandedPositions((prev) => ({ ...prev, [position]: false }));
  };

  const togglePositionExpand = (position) => {
    setExpandedPositions((prev) => ({
      ...prev,
      [position]: !prev[position],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded = {};
    positions.forEach((p) => {
      allExpanded[p] = true;
    });
    setExpandedPositions(allExpanded);
  };

  const handleCollapseAll = () => {
    const allCollapsed = {};
    positions.forEach((p) => {
      allCollapsed[p] = false;
    });
    setExpandedPositions(allCollapsed);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Validate: ensure a candidate is selected for each position
    const missing = positions.filter((p) => !votes[p]);
    if (missing.length > 0) {
      const errs = missing.reduce((acc, p) => ({ ...acc, [p]: true }), {});
      setValidationErrors(errs);
      
      // Auto expand all missing positions so user can pick
      setExpandedPositions((prev) => {
        const updated = { ...prev };
        missing.forEach((p) => {
          updated[p] = true;
        });
        return updated;
      });

      setMessage(`Please select a candidate for all positions (${missing.length} remaining).`);
      
      // Scroll to first unvoted position
      const firstMissing = missing[0];
      if (positionRefs.current[firstMissing]) {
        positionRefs.current[firstMissing].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    const voteArr = Object.entries(votes).map(([position, candidateId]) => ({ position, candidateId }));
    try {
      const res = await fetch(`${API_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ votes: voteArr }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setMessage('Vote submitted successfully!');
      } else {
        setMessage(data.message || 'Error submitting vote.');
      }
    } catch (err) {
      setMessage('Network error submitting vote.');
    } finally {
      setLoading(false);
    }
  };

  // After submission: countdown, clear session then redirect
  useEffect(() => {
    if (!submitted) return;
    const interval = setInterval(() => {
      setRedirectSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          if (onVoted) onVoted();
          navigate('/vote');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, onVoted, navigate]);

  const votedCount = Object.keys(votes).length;
  const totalPositions = positions.length;
  const progressPercent = totalPositions > 0 ? Math.round((votedCount / totalPositions) * 100) : 0;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full border border-primary-100 transform transition-all duration-300">
          <div className="mb-6">
            <div className="w-20 h-20 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Vote Recorded!</h2>
            <p className="text-gray-600 mb-4">Thank you for participating in SAMCA Election 2026.</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Voted as</p>
              <p className="text-sm font-bold text-gray-800">{userEmail}</p>
            </div>
            <p className="text-sm text-gray-500">Redirecting to login in <span className="font-bold text-accent-600">{redirectSeconds}s</span>…</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-primary-100 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-lg font-semibold text-gray-900">Loading voting ballot…</div>
          <p className="text-xs text-gray-500 mt-1">Fetching candidate positions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gray-50 to-primary-100 py-6 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary-100">
          <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative">
            <div className="flex items-center space-x-4 text-center sm:text-left">
              <img
                src="/samca_logo.jpeg"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg border-2 border-white/20"
                alt="SAMCA Logo"
              />
              <div>
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-medium tracking-wide text-accent-200 mb-1 backdrop-blur-sm">
                  Official Election Ballot
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">SAMCA Election 2026</h1>
                <p className="text-xs sm:text-sm text-primary-200 mt-1">Select your preferred candidate for each executive position.</p>
              </div>
            </div>
            
            {/* User Session Info */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15 text-center sm:text-right min-w-[200px]">
              <span className="block text-[11px] font-semibold text-primary-300 uppercase tracking-wider">Logged In Voter</span>
              <span className="block text-sm font-bold text-white truncate max-w-[220px]">{userEmail}</span>
            </div>
          </div>

          {/* Voting Progress Banner */}
          <div className="bg-primary-50/80 px-6 py-4 border-b border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Ballot Progress</span>
                  <span className="text-accent-700 font-bold">{votedCount} of {totalPositions} Selected ({progressPercent}%)</span>
                </div>
                <div className="w-full sm:w-64 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent-500 to-accent-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 text-xs font-medium self-end sm:self-center">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Minimize All
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl font-medium text-sm border flex items-center space-x-3 ${
              message.includes('successfully')
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {message.includes('successfully') ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span>{message}</span>
          </div>
        )}

        {/* Position Accordion List */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {positions.map((position, index) => {
            const isExpanded = !!expandedPositions[position];
            const selectedCandidateId = votes[position];
            const posCandidates = candidates.filter((c) => c.position === position);
            const selectedCandidate = posCandidates.find((c) => c._id === selectedCandidateId);
            const isMissing = !!validationErrors[position];

            const formattedPositionName = position.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

            return (
              <div
                key={position}
                ref={(el) => (positionRefs.current[position] = el)}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                  isMissing
                    ? 'border-red-400 ring-2 ring-red-200'
                    : selectedCandidateId
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-gray-200'
                }`}
              >
                {/* Accordion Header (Click to toggle expand/minimize) */}
                <button
                  type="button"
                  onClick={() => togglePositionExpand(position)}
                  className={`w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors duration-150 ${
                    selectedCandidateId ? 'bg-emerald-50/40 hover:bg-emerald-50/80' : 'bg-gray-50/80 hover:bg-gray-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-primary-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {formattedPositionName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {posCandidates.length} candidate{posCandidates.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>

                  {/* Header Right Status Badge & Toggle Icon */}
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-2">
                    {selectedCandidate ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <svg className="w-3.5 h-3.5 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate max-w-[120px] sm:max-w-[180px]">Voted: {selectedCandidate.name}</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          isMissing
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isMissing ? 'Selection Required' : 'Select Candidate'}
                      </span>
                    )}

                    {/* Chevron Indicator */}
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Validation Error Message inside card */}
                {isMissing && (
                  <div className="px-5 pt-2 pb-1 bg-red-50 text-red-700 text-xs font-semibold flex items-center space-x-1 border-t border-red-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Please pick a candidate for {formattedPositionName} to complete your vote.</span>
                  </div>
                )}

                {/* Expanded Candidates Section (Compact Candidates List) */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-white border-t border-gray-100 transition-all duration-300">
                    {posCandidates.length === 0 ? (
                      <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        No candidates registered for this position yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {posCandidates.map((c) => {
                          const isSelected = selectedCandidateId === c._id;
                          return (
                            <label
                              key={c._id}
                              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer relative group text-center ${
                                isSelected
                                  ? 'border-accent-500 bg-accent-50/70 ring-2 ring-accent-400/40 shadow-md transform scale-[1.02]'
                                  : 'border-gray-200 bg-white hover:border-accent-300 hover:bg-gray-50/60 shadow-sm'
                              }`}
                            >
                              <input
                                type="radio"
                                name={position}
                                value={c._id}
                                checked={isSelected}
                                onChange={() => handleVoteChange(position, c._id)}
                                className="hidden"
                              />

                              {/* Radio Selection Icon at top right */}
                              <div
                                className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-accent-500 text-white shadow-sm'
                                    : 'border-2 border-gray-300 group-hover:border-accent-400 bg-white'
                                }`}
                              >
                                {isSelected && (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>

                              {/* Candidate Avatar (Reduced Small Size) */}
                              <div className="relative mb-2 mt-1">
                                {c.photoUrl ? (
                                  <img
                                    src={c.photoUrl}
                                    alt={c.name}
                                    className={`w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 transition-all shadow-sm ${
                                      isSelected ? 'border-accent-500 ring-2 ring-accent-300' : 'border-gray-200'
                                    }`}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div
                                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all ${
                                      isSelected
                                        ? 'bg-accent-100 text-accent-800 border-accent-500'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}
                                  >
                                    {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                                  </div>
                                )}
                              </div>

                              {/* Candidate Name */}
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                                {c.name}
                              </span>

                              {/* Selection status badge */}
                              {isSelected && (
                                <span className="mt-1.5 inline-block px-2 py-0.5 bg-accent-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  Selected
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Button Bar */}
          <div className="pt-6 pb-12 text-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 hover:from-primary-800 hover:to-primary-700 text-white font-extrabold py-4 px-10 rounded-2xl text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl border border-primary-700 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Submitting Your Vote...
                </span>
              ) : (
                `Submit Official Vote (${votedCount}/${totalPositions})`
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">Votes are final once submitted and cannot be changed.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
