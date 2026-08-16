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
		<div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4 sm:p-6">
			<div className="max-w-6xl mx-auto">
				<div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-primary-100">
					<div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white p-8 flex flex-col items-center">
						<img src="/samca_logo.jpeg" className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white/30 mb-3" alt="SAMCA Logo" />
						<h2 className="text-3xl text-white font-extrabold text-center">Candidate List</h2>
						<p className="text-center mt-2 text-primary-200 text-sm">SAMCA Election 2026</p>
					</div>
					<div className="p-6 sm:p-8 grid gap-8">
						{sortedPositions.map((positionObj) => {
							const position = typeof positionObj === 'object' ? positionObj.name : positionObj;
							const posCandidates = candidates.filter((c) => c.position === position);
							const formattedPositionName = position.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
							
							return (
								<div key={position} className="bg-primary-50/70 rounded-2xl p-6 border-l-4 border-primary-800 shadow-sm">
									<h4 className="text-2xl font-bold text-gray-900 mb-6 capitalize">
										{formattedPositionName}
									</h4>
									{posCandidates.length === 0 ? (
										<p className="text-sm text-gray-500 italic">No candidates registered for this position yet.</p>
									) : (
										<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
											{posCandidates.map((c) => (
												<div
													key={c._id}
													className="flex flex-col items-center p-6 rounded-2xl border-2 border-primary-200 shadow-md bg-white transition-transform hover:scale-[1.02] hover:shadow-lg text-center"
												>
													{c.photoUrl ? (
														<img
															src={c.photoUrl}
															alt={c.name}
															className="w-48 h-48 sm:w-52 sm:h-52 object-cover rounded-full border-4 border-primary-200 mb-4 shadow-md"
															loading="lazy"
														/>
													) : (
														<div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-primary-100 text-primary-800 font-extrabold flex items-center justify-center text-5xl mb-4 border-4 border-primary-200 shadow-md">
															{c.name ? c.name.charAt(0).toUpperCase() : '?'}
														</div>
													)}
													<span className="text-gray-900 font-bold text-xl text-center">
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
