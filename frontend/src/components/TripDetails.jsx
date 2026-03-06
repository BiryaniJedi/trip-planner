import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	GetTripByID,
	DeleteTripById,
	GetPhotosByTripId,
	AddPhoto,
	DeletePhotoById,
	GetPhotoBase64,
	PickPhotoFile,
	GetNotesByTripId,
	CreateNoteByTripId,
	UpdateNoteById,
	DeleteNoteById,
	GetLinksByTripId,
	CreateLinkByTripId,
	UpdateLinkById,
	DeleteLinkById,
	GetExpensesByTripId,
	GetItinerariesByTripId,
} from '../../wailsjs/go/main/App';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';
import { TYPE_LABELS, formatDate, tripDuration, formatCents } from '../utils';

const TYPE_COLORS = {
	travel: 'bg-sky-100 text-sky-700',
	festival: 'bg-purple-100 text-purple-700',
	roadtrip: 'bg-amber-100 text-amber-700',
	other: 'bg-slate-100 text-slate-600',
};

const inputCls =
	'w-full border border-[var(--c-border)] rounded-lg px-3 py-2 text-sm text-[var(--c-text)] bg-[var(--c-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-p3)] focus:border-[var(--c-p4)] transition';
const btnPrimary =
	'text-sm font-medium bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50';
const btnSecondary =
	'text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors cursor-pointer';
const btnSmDanger = 'text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors';
const btnSmGhost = 'text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition-colors';

// ── Small reusable pieces ────────────────────────────────────────────────────

function SectionHeader({ title, onAdd, addLabel = '+ Add' }) {
	return (
		<div className="flex items-center justify-between mb-4">
			<h2 className="text-base font-semibold text-slate-700">{title}</h2>
			{onAdd && (
				<button
					onClick={onAdd}
					className="text-xs font-medium text-[var(--c-p6)] hover:text-[var(--c-p8)] border border-[var(--c-p2)] hover:border-[var(--c-p4)] px-3 py-1 rounded-lg transition-colors cursor-pointer"
				>
					{addLabel}
				</button>
			)}
		</div>
	);
}

function EmptyMsg({ children }) {
	return <p className="text-sm text-slate-400 text-center py-6">{children}</p>;
}

function InlineForm({ children, onCancel, onSave, saving, saveLabel = 'Save' }) {
	return (
		<div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3">
			{children}
			<div className="flex gap-2 justify-end pt-1">
				<button className={btnSecondary} onClick={onCancel}>
					Cancel
				</button>
				<button className={btnPrimary} onClick={onSave} disabled={saving}>
					{saving ? 'Saving…' : saveLabel}
				</button>
			</div>
		</div>
	);
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TripDetails() {
	const { id } = useParams();
	const tripId = parseInt(id);
	const navigate = useNavigate();

	// Core trip
	const [trip, setTrip] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Photos
	const [photos, setPhotos] = useState([]);
	const [photoURLs, setPhotoURLs] = useState({}); // id -> data URL
	const [lightboxId, setLightboxId] = useState(null);
	const [addingPhoto, setAddingPhoto] = useState(false);
	const [pendingPath, setPendingPath] = useState('');
	const [pendingCaption, setPendingCaption] = useState('');
	const [photoSaving, setPhotoSaving] = useState(false);

	// Notes
	const [notes, setNotes] = useState([]);
	const [expandedNoteId, setExpandedNoteId] = useState(null);
	const [editingNoteId, setEditingNoteId] = useState(null);
	const [editNoteTitle, setEditNoteTitle] = useState('');
	const [editNoteContent, setEditNoteContent] = useState('');
	const [addingNote, setAddingNote] = useState(false);
	const [newNoteTitle, setNewNoteTitle] = useState('');
	const [newNoteContent, setNewNoteContent] = useState('');
	const [noteSaving, setNoteSaving] = useState(false);

	// Links
	const [links, setLinks] = useState([]);
	const [addingLink, setAddingLink] = useState(false);
	const [newLinkName, setNewLinkName] = useState('');
	const [newLinkUrl, setNewLinkUrl] = useState('');
	const [editingLinkId, setEditingLinkId] = useState(null);
	const [editLinkName, setEditLinkName] = useState('');
	const [editLinkUrl, setEditLinkUrl] = useState('');
	const [linkSaving, setLinkSaving] = useState(false);
	const [linkError, setLinkError] = useState('');

	// Expenses summary
	const [expenses, setExpenses] = useState([]);

	// Itinerary preview
	const [itinerary, setItinerary] = useState([]);

	// ── Load ──────────────────────────────────────────────────────────────────

	useEffect(() => {
		loadAll();
	}, [tripId]);

	const loadAll = async () => {
		setLoading(true);
		setError(null);
		try {
			const [tripData, photosData, notesData, linksData, expensesData, itineraryData] = await Promise.all([
				GetTripByID(tripId),
				GetPhotosByTripId(tripId),
				GetNotesByTripId(tripId),
				GetLinksByTripId(tripId),
				GetExpensesByTripId(tripId),
				GetItinerariesByTripId(tripId),
			]);
			setTrip(tripData);
			const photoList = photosData ?? [];
			const noteList = notesData ?? [];
			const linkList = linksData ?? [];
			setPhotos(photoList);
			setNotes(noteList);
			setLinks(linkList);
			setExpenses(expensesData ?? []);
			setItinerary(itineraryData ?? []);

			if (photoList.length > 0) {
				loadPhotoURLs(photoList);
			}
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	const loadPhotoURLs = async (photoList) => {
		const entries = await Promise.all(
			photoList.map(async (p) => {
				try {
					const url = await GetPhotoBase64(p.id);
					return [p.id, url];
				} catch {
					return [p.id, null];
				}
			}),
		);
		setPhotoURLs(Object.fromEntries(entries));
	};

	// ── Trip delete ───────────────────────────────────────────────────────────

	const handleDeleteTrip = async () => {
		setDeleting(true);
		try {
			await DeleteTripById(tripId);
			navigate('/trips');
		} catch (e) {
			setError(String(e));
			setDeleting(false);
		}
	};

	// ── Photos ────────────────────────────────────────────────────────────────

	const handlePickPhoto = async () => {
		try {
			const path = await PickPhotoFile();
			if (!path) return;
			setPendingPath(path);
			setPendingCaption('');
			setAddingPhoto(true);
		} catch (e) {
			alert('Could not open file picker: ' + e);
		}
	};

	const handleConfirmPhoto = async () => {
		setPhotoSaving(true);
		try {
			await AddPhoto(tripId, pendingPath, pendingCaption);
			setAddingPhoto(false);
			setPendingPath('');
			setPendingCaption('');
			const photosData = await GetPhotosByTripId(tripId);
			const photoList = photosData ?? [];
			setPhotos(photoList);
			loadPhotoURLs(photoList);
		} catch (e) {
			alert('Failed to add photo: ' + e);
		} finally {
			setPhotoSaving(false);
		}
	};

	const handleDeletePhoto = async (photoId) => {
		try {
			await DeletePhotoById(photoId);
			setPhotos((ps) => ps.filter((p) => p.id !== photoId));
			setPhotoURLs((prev) => {
				const next = { ...prev };
				delete next[photoId];
				return next;
			});
			if (lightboxId === photoId) setLightboxId(null);
		} catch (e) {
			alert('Failed to delete photo: ' + e);
		}
	};

	// Lightbox navigation
	const lightboxIdx = lightboxId !== null ? photos.findIndex((p) => p.id === lightboxId) : -1;
	const lightboxPhoto = lightboxIdx >= 0 ? photos[lightboxIdx] : null;
	const handleLightboxPrev = () => {
		if (lightboxIdx > 0) setLightboxId(photos[lightboxIdx - 1].id);
	};
	const handleLightboxNext = () => {
		if (lightboxIdx < photos.length - 1) setLightboxId(photos[lightboxIdx + 1].id);
	};

	// ── Notes ─────────────────────────────────────────────────────────────────

	const handleAddNote = async () => {
		if (!newNoteTitle.trim()) return;
		setNoteSaving(true);
		try {
			await CreateNoteByTripId(tripId, {
				title: newNoteTitle.trim(),
				content: newNoteContent.trim(),
			});
			setAddingNote(false);
			setNewNoteTitle('');
			setNewNoteContent('');
			const notesData = await GetNotesByTripId(tripId);
			setNotes(notesData ?? []);
		} catch (e) {
			alert('Failed to add note: ' + e);
		} finally {
			setNoteSaving(false);
		}
	};

	const startEditNote = (note) => {
		setEditingNoteId(note.id);
		setEditNoteTitle(note.title);
		setEditNoteContent(note.content);
		setExpandedNoteId(null);
	};

	const handleSaveNote = async (noteId) => {
		if (!editNoteTitle.trim()) return;
		setNoteSaving(true);
		try {
			await UpdateNoteById(noteId, {
				title: editNoteTitle.trim(),
				content: editNoteContent.trim(),
			});
			setEditingNoteId(null);
			const notesData = await GetNotesByTripId(tripId);
			setNotes(notesData ?? []);
		} catch (e) {
			alert('Failed to save note: ' + e);
		} finally {
			setNoteSaving(false);
		}
	};

	const handleDeleteNote = async (noteId) => {
		try {
			await DeleteNoteById(noteId);
			setNotes((ns) => ns.filter((n) => n.id !== noteId));
			if (expandedNoteId === noteId) setExpandedNoteId(null);
			if (editingNoteId === noteId) setEditingNoteId(null);
		} catch (e) {
			alert('Failed to delete note: ' + e);
		}
	};

	// ── Links ─────────────────────────────────────────────────────────────────

	const handleAddLink = async () => {
		setLinkError('');
		if (!newLinkName.trim() || !newLinkUrl.trim()) {
			setLinkError('Name and URL are required.');
			return;
		}
		setLinkSaving(true);
		try {
			await CreateLinkByTripId(tripId, { name: newLinkName.trim(), url: newLinkUrl.trim() });
			setAddingLink(false);
			setNewLinkName('');
			setNewLinkUrl('');
			const linksData = await GetLinksByTripId(tripId);
			setLinks(linksData ?? []);
		} catch (e) {
			setLinkError(String(e));
		} finally {
			setLinkSaving(false);
		}
	};

	const startEditLink = (link) => {
		setEditingLinkId(link.id);
		setEditLinkName(link.name);
		setEditLinkUrl(link.url);
		setLinkError('');
	};

	const handleSaveLink = async (linkId) => {
		setLinkError('');
		if (!editLinkName.trim() || !editLinkUrl.trim()) {
			setLinkError('Name and URL are required.');
			return;
		}
		setLinkSaving(true);
		try {
			await UpdateLinkById(linkId, { name: editLinkName.trim(), url: editLinkUrl.trim() });
			setEditingLinkId(null);
			const linksData = await GetLinksByTripId(tripId);
			setLinks(linksData ?? []);
		} catch (e) {
			setLinkError(String(e));
		} finally {
			setLinkSaving(false);
		}
	};

	const handleDeleteLink = async (linkId) => {
		try {
			await DeleteLinkById(linkId);
			setLinks((ls) => ls.filter((l) => l.id !== linkId));
			if (editingLinkId === linkId) setEditingLinkId(null);
		} catch (e) {
			alert('Failed to delete link: ' + e);
		}
	};

	// ── Expense totals (computed) ─────────────────────────────────────────────

	const expenseTotals = expenses.reduce((acc, e) => {
		acc[e.currency] = (acc[e.currency] || 0) + e.amount;
		return acc;
	}, {});

	// ── Early returns ─────────────────────────────────────────────────────────

	if (error) {
		return (
			<div className="h-full flex flex-col items-center justify-center gap-4">
				<p className="text-red-500 font-medium">{error}</p>
				<button onClick={() => navigate('/trips')} className={btnSecondary}>
					← Back to Trips
				</button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="h-full flex items-center justify-center">
				<p className="text-slate-400 text-lg">Loading…</p>
			</div>
		);
	}

	if (!trip) {
		return (
			<div className="h-full flex flex-col items-center justify-center gap-4">
				<p className="text-slate-500">Trip not found.</p>
				<button onClick={() => navigate('/trips')} className={btnSecondary}>
					← Back to Trips
				</button>
			</div>
		);
	}

	const duration = tripDuration(trip.start_date, trip.end_date);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="min-h-full bg-slate-50 px-6 py-8">
			<div className="max-w-4xl mx-auto flex flex-col gap-5">
				{/* ── Hero card ── */}
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
					<div className="flex items-start justify-between mb-6">
						<span
							className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}
						>
							{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
						</span>
						<div className="flex gap-2">
							<button onClick={() => navigate(`/trips/${tripId}/edit`)} className={btnSecondary}>
								Edit
							</button>
							<button
								onClick={() => setConfirmDelete(true)}
								className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
							>
								Delete
							</button>
						</div>
					</div>

					<h1 className="text-4xl font-bold text-slate-800 mb-4">{trip.name}</h1>

					<div className="flex flex-wrap gap-5 text-slate-500 text-sm">
						<span>📍 {trip.destination}</span>
						<span>
							📅 {formatDate(trip.start_date)} → {formatDate(trip.end_date)}
						</span>
						{duration && <span>⏱ {duration}</span>}
						{trip.need_visa && <span className="text-amber-600 font-medium">🛂 Visa required</span>}
					</div>

					{confirmDelete && (
						<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
							<p className="text-sm text-red-700 font-medium">
								Delete this trip and all its data? This cannot be undone.
							</p>
							<div className="flex gap-2">
								<button onClick={() => setConfirmDelete(false)} className={btnSecondary}>
									Cancel
								</button>
								<button
									onClick={handleDeleteTrip}
									disabled={deleting}
									className="text-sm px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer disabled:opacity-50"
								>
									{deleting ? 'Deleting…' : 'Yes, Delete'}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* ── Photos ── */}
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
					<SectionHeader title="Photos" onAdd={handlePickPhoto} addLabel="+ Add Photo" />

					{addingPhoto && (
						<InlineForm
							onCancel={() => {
								setAddingPhoto(false);
								setPendingPath('');
								setPendingCaption('');
							}}
							onSave={handleConfirmPhoto}
							saving={photoSaving}
							saveLabel="Save Photo"
						>
							<p className="text-xs text-slate-500 truncate">
								Selected:{' '}
								<span className="font-medium text-slate-700">{pendingPath.split('/').pop()}</span>
							</p>
							<input
								type="text"
								placeholder="Caption (optional)"
								value={pendingCaption}
								onChange={(e) => setPendingCaption(e.target.value)}
								className={inputCls}
							/>
						</InlineForm>
					)}

					{photos.length === 0 ? (
						<EmptyMsg>No photos yet. Add one to remember the trip!</EmptyMsg>
					) : (
						<div className="grid grid-cols-4 gap-3">
							{photos.map((photo) => {
								const url = photoURLs[photo.id];
								return (
									<div
										key={photo.id}
										className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-100"
										onClick={() => url && setLightboxId(photo.id)}
									>
										{url ? (
											<img src={url} alt={photo.caption} className="w-full h-full object-cover" />
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<div className="w-6 h-6 border-2 border-slate-300 border-t-[var(--c-p4)] rounded-full animate-spin" />
											</div>
										)}
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-end justify-between p-2">
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeletePhoto(photo.id);
												}}
												className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg cursor-pointer"
											>
												Delete
											</button>
											{photo.caption && (
												<p className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs w-full truncate">
													{photo.caption}
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* ── Notes | Links ── */}
				<div className="grid grid-cols-2 gap-5">
					{/* Notes */}
					<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
						<SectionHeader
							title="Notes"
							onAdd={() => {
								setAddingNote(true);
								setEditingNoteId(null);
							}}
						/>

						{addingNote && (
							<InlineForm
								onCancel={() => {
									setAddingNote(false);
									setNewNoteTitle('');
									setNewNoteContent('');
								}}
								onSave={handleAddNote}
								saving={noteSaving}
							>
								<input
									type="text"
									placeholder="Title *"
									value={newNoteTitle}
									onChange={(e) => setNewNoteTitle(e.target.value)}
									className={inputCls}
								/>
								<textarea
									placeholder="Content (optional)"
									value={newNoteContent}
									onChange={(e) => setNewNoteContent(e.target.value)}
									rows={3}
									className={inputCls + ' resize-none'}
								/>
							</InlineForm>
						)}

						{notes.length === 0 && !addingNote ? (
							<EmptyMsg>No notes yet.</EmptyMsg>
						) : (
							<div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
								{notes.map((note) =>
									editingNoteId === note.id ? (
										<InlineForm
											key={note.id}
											onCancel={() => setEditingNoteId(null)}
											onSave={() => handleSaveNote(note.id)}
											saving={noteSaving}
											saveLabel="Update"
										>
											<input
												type="text"
												value={editNoteTitle}
												onChange={(e) => setEditNoteTitle(e.target.value)}
												className={inputCls}
											/>
											<textarea
												value={editNoteContent}
												onChange={(e) => setEditNoteContent(e.target.value)}
												rows={3}
												className={inputCls + ' resize-none'}
											/>
										</InlineForm>
									) : (
										<div
											key={note.id}
											className="border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors cursor-pointer"
											onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
										>
											<div className="flex items-start justify-between gap-2">
												<p className="text-sm font-medium text-slate-700 leading-snug">
													{note.title}
												</p>
												<div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
													<button className={btnSmGhost} onClick={() => startEditNote(note)}>
														Edit
													</button>
													<button className={btnSmDanger} onClick={() => handleDeleteNote(note.id)}>
														Delete
													</button>
												</div>
											</div>
											{expandedNoteId === note.id && note.content && (
												<p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">
													{note.content}
												</p>
											)}
											{expandedNoteId !== note.id && note.content && (
												<p className="text-xs text-slate-400 mt-1 truncate">{note.content}</p>
											)}
										</div>
									),
								)}
							</div>
						)}
					</div>

					{/* Links */}
					<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
						<SectionHeader
							title="Links"
							onAdd={() => {
								setAddingLink(true);
								setEditingLinkId(null);
								setLinkError('');
							}}
						/>

						{addingLink && (
							<InlineForm
								onCancel={() => {
									setAddingLink(false);
									setNewLinkName('');
									setNewLinkUrl('');
									setLinkError('');
								}}
								onSave={handleAddLink}
								saving={linkSaving}
							>
								<input
									type="text"
									placeholder="Name *"
									value={newLinkName}
									onChange={(e) => setNewLinkName(e.target.value)}
									className={inputCls}
								/>
								<input
									type="url"
									placeholder="https://..."
									value={newLinkUrl}
									onChange={(e) => setNewLinkUrl(e.target.value)}
									className={inputCls}
								/>
								{linkError && <p className="text-xs text-red-500">{linkError}</p>}
							</InlineForm>
						)}

						{links.length === 0 && !addingLink ? (
							<EmptyMsg>No links yet.</EmptyMsg>
						) : (
							<div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
								{links.map((link) =>
									editingLinkId === link.id ? (
										<InlineForm
											key={link.id}
											onCancel={() => {
												setEditingLinkId(null);
												setLinkError('');
											}}
											onSave={() => handleSaveLink(link.id)}
											saving={linkSaving}
											saveLabel="Update"
										>
											<input
												type="text"
												value={editLinkName}
												onChange={(e) => setEditLinkName(e.target.value)}
												className={inputCls}
											/>
											<input
												type="url"
												value={editLinkUrl}
												onChange={(e) => setEditLinkUrl(e.target.value)}
												className={inputCls}
											/>
											{linkError && <p className="text-xs text-red-500">{linkError}</p>}
										</InlineForm>
									) : (
										<div
											key={link.id}
											className="flex items-center gap-2 border border-slate-100 rounded-xl px-3 py-2.5 hover:border-slate-200 transition-colors"
										>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-slate-700 truncate">{link.name}</p>
												<p className="text-xs text-slate-400 truncate">{link.url}</p>
											</div>
											<div className="flex gap-2 shrink-0">
												<button
													onClick={() => BrowserOpenURL(link.url)}
													className="text-xs font-medium text-[var(--c-p6)] hover:text-[var(--c-p8)] border border-[var(--c-p2)] hover:border-[var(--c-p4)] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
												>
													Open ↗
												</button>
												<button className={btnSmGhost} onClick={() => startEditLink(link)}>
													Edit
												</button>
												<button className={btnSmDanger} onClick={() => handleDeleteLink(link.id)}>
													Delete
												</button>
											</div>
										</div>
									),
								)}
							</div>
						)}
					</div>
				</div>

				{/* ── Itinerary preview ── */}
			<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-base font-semibold text-slate-700">Itinerary</h2>
					<button onClick={() => navigate(`/trips/${tripId}/itinerary`)} className={btnSecondary}>
						{itinerary.length === 0 ? '+ Plan Itinerary' : 'Full View →'}
					</button>
				</div>

				{itinerary.length === 0 ? (
					<EmptyMsg>No itinerary yet. Plan your days!</EmptyMsg>
				) : (
					<div className="flex flex-col divide-y divide-slate-100 max-h-56 overflow-y-auto">
						{itinerary.map((event) => {
							const d = new Date(event.date + 'T00:00:00');
							const shortDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
							return (
								<div key={event.id} className="flex items-baseline gap-3 py-2.5 pr-1">
									<span className="text-xs text-slate-400 shrink-0 w-28">{shortDate}</span>
									<span className="text-xs font-mono text-[var(--c-p6)] shrink-0 w-12">{event.time}</span>
									<div className="min-w-0">
										<p className="text-sm text-slate-700 font-medium truncate">{event.title}</p>
										{event.description && (
											<p className="text-xs text-slate-400 truncate">{event.description}</p>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* ── Expenses summary ── */}
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-base font-semibold text-slate-700">Expenses</h2>
						<button onClick={() => navigate(`/trips/${tripId}/expenses`)} className={btnSecondary}>
							Manage →
						</button>
					</div>

					{expenses.length === 0 ? (
						<EmptyMsg>No expenses tracked yet.</EmptyMsg>
					) : (
						<div className="flex flex-wrap gap-6 items-end">
							{Object.entries(expenseTotals).map(([currency, total]) => (
								<div key={currency}>
									<p className="text-3xl font-bold text-slate-800">
										{formatCents(total, currency)}
									</p>
									<p className="text-xs text-slate-400 mt-0.5">{currency} total</p>
								</div>
							))}
							<p className="text-sm text-slate-400 ml-auto">
								{expenses.length} expense{expenses.length !== 1 ? 's' : ''}
							</p>
						</div>
					)}
				</div>
			</div>

			{/* ── Lightbox ── */}
			{lightboxId !== null && (
				<div
					className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center"
					onClick={() => setLightboxId(null)}
				>
					{lightboxIdx > 0 && (
						<button
							className="absolute left-5 text-white/70 hover:text-white text-4xl cursor-pointer select-none"
							onClick={(e) => {
								e.stopPropagation();
								handleLightboxPrev();
							}}
						>
							‹
						</button>
					)}

					<div
						className="flex flex-col items-center gap-3 max-w-[80vw] max-h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						{photoURLs[lightboxId] && (
							<img
								src={photoURLs[lightboxId]}
								alt={lightboxPhoto?.caption}
								className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
							/>
						)}
						{lightboxPhoto?.caption && (
							<p className="text-white/80 text-sm">{lightboxPhoto.caption}</p>
						)}
					</div>

					{lightboxIdx < photos.length - 1 && (
						<button
							className="absolute right-5 text-white/70 hover:text-white text-4xl cursor-pointer select-none"
							onClick={(e) => {
								e.stopPropagation();
								handleLightboxNext();
							}}
						>
							›
						</button>
					)}

					<button
						className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl cursor-pointer"
						onClick={() => setLightboxId(null)}
					>
						✕
					</button>
				</div>
			)}
		</div>
	);
}
