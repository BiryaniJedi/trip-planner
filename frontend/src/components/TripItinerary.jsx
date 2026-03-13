import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	GetTripByID,
	GetItinerariesByTripId,
	CreateItineraryByTripId,
	UpdateItineraryById,
	DeleteItineraryById,
} from '../../wailsjs/go/main/App';

const inputCls =
	'w-full border border-[var(--c-border)] rounded-lg px-3 py-2 text-sm text-[var(--c-text)] bg-[var(--c-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-p3)] focus:border-[var(--c-p4)] transition';
const btnPrimary =
	'text-sm font-medium bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50';
const btnSecondary =
	'text-sm font-medium border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-[var(--c-hover)] px-4 py-2 rounded-lg transition-colors cursor-pointer';
const btnSmDanger = 'text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors';
const btnSmGhost  = 'text-xs text-[var(--c-muted)] hover:text-[var(--c-text2)] cursor-pointer transition-colors';

function PageSpinner() {
	return (
		<div className="h-full flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="w-8 h-8 rounded-full border-2 border-[var(--c-border)] border-t-[var(--c-p6)] animate-spin" />
				<p className="text-sm text-[var(--c-muted)]">Loading…</p>
			</div>
		</div>
	);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function dayHeader(tripStartDate, eventDate) {
	const d     = new Date(eventDate + 'T00:00:00');
	const start = new Date(tripStartDate + 'T00:00:00');
	const dayNum  = Math.round((d - start) / 86400000) + 1;
	const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
	const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	return `Day ${dayNum} \u2014 ${weekday}, ${monthDay}`;
}

function groupByDate(events) {
	return (events ?? []).reduce((acc, e) => {
		if (!acc[e.date]) acc[e.date] = [];
		acc[e.date].push(e);
		return acc;
	}, {});
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TripItinerary() {
	const { id } = useParams();
	const tripId  = parseInt(id);
	const navigate = useNavigate();

	const [trip, setTrip]       = useState(null);
	const [events, setEvents]   = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError]     = useState(null);

	// Add form
	const [adding, setAdding]           = useState(false);
	const [newDate, setNewDate]         = useState('');
	const [newTime, setNewTime]         = useState('');
	const [newTitle, setNewTitle]       = useState('');
	const [newDesc, setNewDesc]         = useState('');
	const [addError, setAddError]       = useState('');
	const [saving, setSaving]           = useState(false);

	// Edit form
	const [editingId, setEditingId]     = useState(null);
	const [editDate, setEditDate]       = useState('');
	const [editTime, setEditTime]       = useState('');
	const [editTitle, setEditTitle]     = useState('');
	const [editDesc, setEditDesc]       = useState('');
	const [editError, setEditError]     = useState('');
	const [editSaving, setEditSaving]   = useState(false);

	// ── Load ──────────────────────────────────────────────────────────────────

	useEffect(() => { loadAll(); }, [tripId]);

	const loadAll = async () => {
		setLoading(true);
		setError(null);
		try {
			const [tripData, eventsData] = await Promise.all([
				GetTripByID(tripId),
				GetItinerariesByTripId(tripId),
			]);
			setTrip(tripData);
			setEvents(eventsData ?? []);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	// ── Add ───────────────────────────────────────────────────────────────────

	const openAdd = () => {
		setNewDate(trip?.start_date ?? '');
		setNewTime('');
		setNewTitle('');
		setNewDesc('');
		setAddError('');
		setAdding(true);
		setEditingId(null);
	};

	const handleAdd = async () => {
		if (!newDate) { setAddError('Date is required.'); return; }
		if (!newTime) { setAddError('Time is required.'); return; }
		if (!newTitle.trim()) { setAddError('Title is required.'); return; }
		setAddError('');
		setSaving(true);
		try {
			await CreateItineraryByTripId(tripId, {
				date:        newDate,
				time:        newTime,
				title:       newTitle.trim(),
				description: newDesc.trim(),
			});
			setAdding(false);
			const data = await GetItinerariesByTripId(tripId);
			setEvents(data ?? []);
		} catch (e) {
			setAddError(String(e));
		} finally {
			setSaving(false);
		}
	};

	// ── Edit ──────────────────────────────────────────────────────────────────

	const startEdit = (event) => {
		setEditingId(event.id);
		setEditDate(event.date);
		setEditTime(event.time);
		setEditTitle(event.title);
		setEditDesc(event.description);
		setEditError('');
		setAdding(false);
	};

	const handleSave = async (eventId) => {
		if (!editDate) { setEditError('Date is required.'); return; }
		if (!editTime) { setEditError('Time is required.'); return; }
		if (!editTitle.trim()) { setEditError('Title is required.'); return; }
		setEditError('');
		setEditSaving(true);
		try {
			await UpdateItineraryById(eventId, {
				date:        editDate,
				time:        editTime,
				title:       editTitle.trim(),
				description: editDesc.trim(),
			});
			setEditingId(null);
			const data = await GetItinerariesByTripId(tripId);
			setEvents(data ?? []);
		} catch (e) {
			setEditError(String(e));
		} finally {
			setEditSaving(false);
		}
	};

	// ── Delete ────────────────────────────────────────────────────────────────

	const handleDelete = async (eventId) => {
		try {
			await DeleteItineraryById(eventId);
			setEvents((prev) => prev.filter((e) => e.id !== eventId));
			if (editingId === eventId) setEditingId(null);
		} catch (e) {
			alert('Failed to delete event: ' + e);
		}
	};

	// ── Early returns ─────────────────────────────────────────────────────────

	if (error) {
		return (
			<div className="h-full flex flex-col items-center justify-center gap-4">
				<p className="text-red-500 font-medium">{error}</p>
				<button onClick={() => navigate(`/trips/${tripId}`)} className={btnSecondary}>
					← Back to Trip
				</button>
			</div>
		);
	}

	if (loading) return <PageSpinner />;

	// ── Group and sort ────────────────────────────────────────────────────────

	const grouped     = groupByDate(events);
	const sortedDates = Object.keys(grouped).sort();

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="min-h-full bg-[var(--c-bg)] px-6 py-8 page-in">
			<div className="max-w-3xl mx-auto flex flex-col gap-6">

				{/* ── Header ── */}
				<div className="flex items-center justify-between">
					<div>
						<button
							onClick={() => navigate(`/trips/${tripId}`)}
							className="text-sm text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors cursor-pointer mb-1 flex items-center gap-1"
						>
							← {trip?.name ?? 'Trip'}
						</button>
						<h1 className="text-2xl font-bold text-[var(--c-text)]">Itinerary</h1>
						{trip?.start_date && trip?.end_date && (
							<p className="text-sm text-[var(--c-muted)] mt-0.5">
								{new Date(trip.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
								{' → '}
								{new Date(trip.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
							</p>
						)}
					</div>
					{!adding && (
						<button onClick={openAdd} className={btnPrimary}>
							+ Add Event
						</button>
					)}
				</div>

				{/* ── Add form ── */}
				{adding && (
					<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm p-5 flex flex-col gap-3">
						<h3 className="text-sm font-semibold text-[var(--c-text)]">New Event</h3>
						{addError && (
							<p className="text-xs text-red-500">{addError}</p>
						)}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-xs font-medium text-[var(--c-muted)] mb-1">Date *</label>
								<input
									type="date"
									value={newDate}
									min={trip?.start_date}
									max={trip?.end_date}
									onChange={(e) => setNewDate(e.target.value)}
									className={inputCls}
								/>
							</div>
							<div>
								<label className="block text-xs font-medium text-[var(--c-muted)] mb-1">Time *</label>
								<input
									type="time"
									value={newTime}
									onChange={(e) => setNewTime(e.target.value)}
									className={inputCls}
								/>
							</div>
						</div>
						<div>
							<label className="block text-xs font-medium text-[var(--c-muted)] mb-1">Title *</label>
							<input
								type="text"
								placeholder="e.g. Coffee at local café"
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								className={inputCls}
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-[var(--c-muted)] mb-1">Description</label>
							<textarea
								placeholder="Optional notes…"
								value={newDesc}
								onChange={(e) => setNewDesc(e.target.value)}
								rows={2}
								className={inputCls + ' resize-none'}
							/>
						</div>
						<div className="flex gap-2 justify-end">
							<button
								className={btnSecondary}
								onClick={() => { setAdding(false); setAddError(''); }}
							>
								Cancel
							</button>
							<button className={btnPrimary} onClick={handleAdd} disabled={saving}>
								{saving ? 'Saving…' : 'Save Event'}
							</button>
						</div>
					</div>
				)}

				{/* ── Empty state ── */}
				{events.length === 0 && !adding && (
					<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm p-12 text-center">
						<p className="text-[var(--c-muted)] text-sm mb-4">No events yet. Start planning your days!</p>
						<button onClick={openAdd} className={btnPrimary}>
							+ Add First Event
						</button>
					</div>
				)}

				{/* ── Day groups ── */}
				{sortedDates.map((date) => (
					<div key={date} className="flex flex-col gap-1">

						{/* Day header */}
						<div className="flex items-center gap-3 mb-1">
							<h2 className="text-xs font-semibold text-[var(--c-p6)] uppercase tracking-wide">
								{dayHeader(trip?.start_date ?? date, date)}
							</h2>
							<div className="flex-1 h-px bg-[var(--c-border)]" />
						</div>

						{/* Events for this day */}
						<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm overflow-hidden">
							{grouped[date].map((event, idx) => (
								<div key={event.id}>
									{/* Divider between events */}
									{idx > 0 && <div className="border-t border-[var(--c-border)] mx-4" />}

									{editingId === event.id ? (
										/* ── Edit form ── */
										<div className="p-4 flex flex-col gap-3">
											{editError && <p className="text-xs text-red-500">{editError}</p>}
											<div className="grid grid-cols-2 gap-3">
												<div>
													<label className="block text-xs font-medium text-[var(--c-muted)] mb-1">Date *</label>
													<input
														type="date"
														value={editDate}
														min={trip?.start_date}
														max={trip?.end_date}
														onChange={(e) => setEditDate(e.target.value)}
														className={inputCls}
													/>
												</div>
												<div>
													<label className="block text-xs font-medium text-[var(--c-muted)] mb-1">Time *</label>
													<input
														type="time"
														value={editTime}
														onChange={(e) => setEditTime(e.target.value)}
														className={inputCls}
													/>
												</div>
											</div>
											<input
												type="text"
												value={editTitle}
												onChange={(e) => setEditTitle(e.target.value)}
												className={inputCls}
											/>
											<textarea
												value={editDesc}
												onChange={(e) => setEditDesc(e.target.value)}
												rows={2}
												className={inputCls + ' resize-none'}
											/>
											<div className="flex gap-2 justify-end">
												<button
													className={btnSecondary}
													onClick={() => { setEditingId(null); setEditError(''); }}
												>
													Cancel
												</button>
												<button
													className={btnPrimary}
													onClick={() => handleSave(event.id)}
													disabled={editSaving}
												>
													{editSaving ? 'Saving…' : 'Update'}
												</button>
											</div>
										</div>
									) : (
										/* ── Event row ── */
										<div className="flex items-start gap-4 px-5 py-3.5 hover:bg-[var(--c-hover)] transition-colors group">
											{/* Time badge */}
											<span className="text-xs font-mono font-semibold text-[var(--c-p6)] bg-[var(--c-p1)] px-2 py-1 rounded-md shrink-0 mt-0.5 min-w-[3.5rem] text-center">
												{event.time}
											</span>
											{/* Content */}
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-[var(--c-text)] leading-snug">
													{event.title}
												</p>
												{event.description && (
													<p className="text-xs text-[var(--c-muted)] mt-0.5 leading-relaxed">
														{event.description}
													</p>
												)}
											</div>
											{/* Actions — visible on hover */}
											<div className="flex gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
												<button className={btnSmGhost} onClick={() => startEdit(event)}>
													Edit
												</button>
												<button className={btnSmDanger} onClick={() => handleDelete(event.id)}>
													Delete
												</button>
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				))}

			</div>
		</div>
	);
}
