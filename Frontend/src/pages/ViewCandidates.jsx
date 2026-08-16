import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const API_URL = `${API_BASE}/vote`;

export default function ViewCandidates() {
	const [positions, setPositions] = useState([]);
	const [candidates, setCandidates] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		setLoading(true);
		fetch(`${API_URL}/positions-candidates`)
			.then((res) => res.json())
			.then((data) => {
				setPositions(data.positions || []);
				setCandidates(data.candidates || []);
				setLoading(false);
			})
			.catch(() => {
				setError("Failed to load candidates.");
				setLoading(false);
			});
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
				<div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-primary-100 flex flex-col items-center">
					<svg className="animate-spin h-8 w-8 text-primary-800 mb-4" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<div className="text-lg font-semibold text-text-primary">Loading candidates…</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
				<div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-primary-100 flex flex-col items-center">
					<div className="text-lg font-semibold text-red-700">{error}</div>
				</div>
			</div>
		);
	}

		// If positions is an array of objects, sort by 'order' property
		let sortedPositions = positions;
		if (positions.length && typeof positions[0] === 'object' && positions[0].order !== undefined) {
			sortedPositions = [...positions].sort((a, b) => a.order - b.order);
		}

		return (
			<div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
				<div className="mx-auto">
					<div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-primary-100">
						<div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white p-6 flex flex-col items-center">
							<img src="/samca_logo.jpeg" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white/30 mb-3" alt="SAMCA Logo" />
							<h2 className="text-3xl text-white font-bold text-center">Candidate List</h2>
							<p className="text-center mt-2 opacity-90">SAMCA Election 2026</p>
						</div>
						<div className="p-6 grid gap-6 max-w-5xl mx-auto">
							{sortedPositions.map((positionObj) => {
								// If positions is array of strings, fallback to old behavior
								const position = typeof positionObj === 'object' ? positionObj.name : positionObj;
								const posCandidates = candidates.filter((c) => c.position === position);
								const formattedPositionName = position.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
								
								return (
									<div key={position} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
										<div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
											<h4 className="text-lg font-bold text-gray-900">
												{formattedPositionName}
											</h4>
											<span className="text-xs font-semibold px-2.5 py-1 bg-primary-100 text-primary-800 rounded-full">
												{posCandidates.length} Candidates
											</span>
										</div>
										{posCandidates.length === 0 ? (
											<p className="text-xs text-gray-500 italic py-2">No candidates for this position.</p>
										) : (
											<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
												{posCandidates.map((c) => (
													<div
														key={c._id}
														className="flex flex-col items-center p-3 rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all text-center"
													>
														{c.photoUrl ? (
															<img
																src={c.photoUrl}
																alt={c.name}
																className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-primary-200 mb-2 shadow-sm"
																loading="lazy"
															/>
														) : (
															<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-lg mb-2 border-2 border-primary-200">
																{c.name ? c.name.charAt(0).toUpperCase() : '?'}
															</div>
														)}
														<span className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
															{c.name}
														</span>
													</div>
												))}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		);
}
