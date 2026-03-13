import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	GetTripByID, DeleteTripById,
	GetPhotosByTripId, AddPhoto, DeletePhotoById, GetPhotoBase64, PickPhotoFile,
	GetNotesByTripId, CreateNoteByTripId, UpdateNoteById, DeleteNoteById,
	GetLinksByTripId, CreateLinkByTripId, UpdateLinkById, DeleteLinkById,
	GetExpensesByTripId, GetItinerariesByTripId,
} from '../../wailsjs/go/main/App';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';
import { TYPE_LABELS, formatDate, tripDuration, formatCents } from '../utils';

const TYPE_COLORS = {
	travel:   'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
	festival: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
	roadtrip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
	other:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

// Gradient top strip on hero card
const TYPE_GRADIENT = {
	travel:   'from-sky-400 to-cyan-400',
	festival: 'from-purple-400 to-violet-500',
	roadtrip: 'from-amber-400 to-orange-400',
	other:    'from-[var(--c-p4)] to-[var(--c-p6)]',
};

const inputCls =
	'w-full border border-[var(--c-border)] rounded-lg px-3 py-2 text-sm text-[var(--c-text)] bg-[var(--c-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-p3)] focus:border-[var(--c-p4)] transition placeholder:text-[var(--c-muted)]';
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

function SectionCard({ title, action, action2, children }) {
	return (
		<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm overflow-hidden">
			<div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--c-border)]">
				<h2 className="text-sm font-semibold text-[var(--c-text)]">{title}</h2>
				<div className="flex items-center gap-2">
					{action2}
					{action}
				</div>
			</div>
			<div className="p-6">{children}</div>
		</div>
	);
}

function EmptyMsg({ icon, text }) {
	return (
		<div className="py-8 text-center">
			{icon && <p className="text-3xl mb-2">{icon}</p>}
			<p className="text-sm text-[var(--c-muted)]">{text}</p>
		</div>
	);
}

function InlineForm({ children, onCancel, onSave, saving, saveLabel = 'Save' }) {
	return (
		<div className="flex flex-col gap-2 p-3 bg-[var(--c-hover)] border border-[var(--c-border)] rounded-xl mb-3">
			{children}
			<div className="flex gap-2 justify-end pt-1">
				<button className={btnSecondary} onClick={onCancel}>Cancel</button>
				<button className={btnPrimary} onClick={onSave} disabled={saving}>
					{saving ? 'Saving…' : saveLabel}
				</button>
			</div>
		</div>
	);
}

function AddBtn({ onClick, label }) {
	return (
		<button
			onClick={onClick}
			className="text-xs font-medium text-[var(--c-p6)] hover:text-[var(--c-p8)] border border-[var(--c-p2)] hover:border-[var(--c-p4)] hover:bg-[var(--c-p1)] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
		>
			{label}
		</button>
	);
}

export default function TripDetails() {
	const { id } = useParams();
	const tripId = parseInt(id);
	const navigate = useNavigate();

	const [trip, setTrip] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const [photos, setPhotos] = useState([]);
	const [photoURLs, setPhotoURLs] = useState({});
	const [lightboxId, setLightboxId] = useState(null);
	const [addingPhoto, setAddingPhoto] = useState(false);
	const [pendingPath, setPendingPath] = useState('');
	const [pendingCaption, setPendingCaption] = useState('');
	const [photoSaving, setPhotoSaving] = useState(false);

	const [notes, setNotes] = useState([]);
	const [expandedNoteId, setExpandedNoteId] = useState(null);
	const [editingNoteId, setEditingNoteId] = useState(null);
	const [editNoteTitle, setEditNoteTitle] = useState('');
	const [editNoteContent, setEditNoteContent] = useState('');
	const [addingNote, setAddingNote] = useState(false);
	const [newNoteTitle, setNewNoteTitle] = useState('');
	const [newNoteContent, setNewNoteContent] = useState('');
	const [noteSaving, setNoteSaving] = useState(false);

	const [links, setLinks] = useState([]);
	const [addingLink, setAddingLink] = useState(false);
	const [newLinkName, setNewLinkName] = useState('');
	const [newLinkUrl, setNewLinkUrl] = useState('');
	const [editingLinkId, setEditingLinkId] = useState(null);
	const [editLinkName, setEditLinkName] = useState('');
	const [editLinkUrl, setEditLinkUrl] = useState('');
	const [linkSaving, setLinkSaving] = useState(false);
	const [linkError, setLinkError] = useState('');

	const [expenses, setExpenses] = useState([]);
	const [itinerary, setItinerary] = useState([]);

	useEffect(() => { loadAll(); }, [tripId]);

	const loadAll = async () => {
		setLoading(true);
		setError(null);
		try {
			const [tripData, photosData, notesData, linksData, expensesData, itineraryData] = await Promise.all([
				GetTripByID(tripId), GetPhotosByTripId(tripId), GetNotesByTripId(tripId),
				GetLinksByTripId(tripId), GetExpensesByTripId(tripId), GetItinerariesByTripId(tripId),
			]);
			setTrip(tripData);
			const photoList = photosData ?? [];
			setPhotos(photoList);
			setNotes(notesData ?? []);
			setLinks(linksData ?? []);
			setExpenses(expensesData ?? []);
			setItinerary(itineraryData ?? []);
			if (photoList.length > 0) loadPhotoURLs(photoList);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	const loadPhotoURLs = async (photoList) => {
		const entries = await Promise.all(
			photoList.map(async (p) => {
				try { return [p.id, await GetPhotoBase64(p.id)]; }
				catch { return [p.id, null]; }
			}),
		);
		setPhotoURLs(Object.fromEntries(entries));
	};

	const handleDeleteTrip = async () => {
		setDeleting(true);
		try { await DeleteTripById(tripId); navigate('/trips'); }
		catch (e) { setError(String(e)); setDeleting(false); }
	};

	const handlePickPhoto = async () => {
		try {
			const path = await PickPhotoFile();
			if (!path) return;
			setPendingPath(path); setPendingCaption(''); setAddingPhoto(true);
		} catch (e) { alert('Could not open file picker: ' + e); }
	};

	const handleConfirmPhoto = async () => {
		setPhotoSaving(true);
		try {
			await AddPhoto(tripId, pendingPath, pendingCaption);
			setAddingPhoto(false); setPendingPath(''); setPendingCaption('');
			const photoList = (await GetPhotosByTripId(tripId)) ?? [];
			setPhotos(photoList); loadPhotoURLs(photoList);
		} catch (e) { alert('Failed to add photo: ' + e); }
		finally { setPhotoSaving(false); }
	};

	const handleDeletePhoto = async (photoId) => {
		try {
			await DeletePhotoById(photoId);
			setPhotos((ps) => ps.filter((p) => p.id !== photoId));
			setPhotoURLs((prev) => { const n = { ...prev }; delete n[photoId]; return n; });
			if (lightboxId === photoId) setLightboxId(null);
		} catch (e) { alert('Failed to delete photo: ' + e); }
	};

	const lightboxIdx   = lightboxId !== null ? photos.findIndex((p) => p.id === lightboxId) : -1;
	const lightboxPhoto = lightboxIdx >= 0 ? photos[lightboxIdx] : null;

	const handleAddNote = async () => {
		if (!newNoteTitle.trim()) return;
		setNoteSaving(true);
		try {
			await CreateNoteByTripId(tripId, { title: newNoteTitle.trim(), content: newNoteContent.trim() });
			setAddingNote(false); setNewNoteTitle(''); setNewNoteContent('');
			setNotes((await GetNotesByTripId(tripId)) ?? []);
		} catch (e) { alert('Failed to add note: ' + e); }
		finally { setNoteSaving(false); }
	};

	const handleSaveNote = async (noteId) => {
		if (!editNoteTitle.trim()) return;
		setNoteSaving(true);
		try {
			await UpdateNoteById(noteId, { title: editNoteTitle.trim(), content: editNoteContent.trim() });
			setEditingNoteId(null);
			setNotes((await GetNotesByTripId(tripId)) ?? []);
		} catch (e) { alert('Failed to save note: ' + e); }
		finally { setNoteSaving(false); }
	};

	const handleDeleteNote = async (noteId) => {
		try {
			await DeleteNoteById(noteId);
			setNotes((ns) => ns.filter((n) => n.id !== noteId));
			if (expandedNoteId === noteId) setExpandedNoteId(null);
			if (editingNoteId === noteId) setEditingNoteId(null);
		} catch (e) { alert('Failed to delete note: ' + e); }
	};

	const handleAddLink = async () => {
		setLinkError('');
		if (!newLinkName.trim() || !newLinkUrl.trim()) { setLinkError('Name and URL are required.'); return; }
		setLinkSaving(true);
		try {
			await CreateLinkByTripId(tripId, { name: newLinkName.trim(), url: newLinkUrl.trim() });
			setAddingLink(false); setNewLinkName(''); setNewLinkUrl('');
			setLinks((await GetLinksByTripId(tripId)) ?? []);
		} catch (e) { setLinkError(String(e)); }
		finally { setLinkSaving(false); }
	};

	const handleSaveLink = async (linkId) => {
		setLinkError('');
		if (!editLinkName.trim() || !editLinkUrl.trim()) { setLinkError('Name and URL are required.'); return; }
		setLinkSaving(true);
		try {
			await UpdateLinkById(linkId, { name: editLinkName.trim(), url: editLinkUrl.trim() });
			setEditingLinkId(null);
			setLinks((await GetLinksByTripId(tripId)) ?? []);
		} catch (e) { setLinkError(String(e)); }
		finally { setLinkSaving(false); }
	};

	const handleDeleteLink = async (linkId) => {
		try {
			await DeleteLinkById(linkId);
			setLinks((ls) => ls.filter((l) => l.id !== linkId));
			if (editingLinkId === linkId) setEditingLinkId(null);
		} catch (e) { alert('Failed to delete link: ' + e); }
	};

	const expenseTotals = expenses.reduce((acc, e) => {
		acc[e.currency] = (acc[e.currency] || 0) + e.amount; return acc;
	}, {});

	if (error) return (
		<div className="h-full flex flex-col items-center justify-center gap-4">
			<p className="text-red-500 font-medium">{error}</p>
			<button onClick={() => navigate('/trips')} className={btnSecondary}>← Back to Trips</button>
		</div>
	);

	if (loading) return <PageSpinner />;

	if (!trip) return (
		<div className="h-full flex flex-col items-center justify-center gap-4">
			<p className="text-[var(--c-text3)]">Trip not found.</p>
			<button onClick={() => navigate('/trips')} className={btnSecondary}>← Back to Trips</button>
		</div>
	);

	const duration = tripDuration(trip.start_date, trip.end_date);
	const gradient = TYPE_GRADIENT[trip.trip_type] ?? TYPE_GRADIENT.other;

	return (
		<div className="min-h-full bg-[var(--c-bg)] px-8 py-8 page-in">
			<div className="max-w-5xl mx-auto flex flex-col gap-5">

				{/* Back nav */}
				<button
					onClick={() => navigate('/trips')}
					className="text-[var(--c-muted)] hover:text-[var(--c-text2)] text-sm flex items-center gap-1 cursor-pointer transition-colors self-start"
				>
					← My Trips
				</button>

				{/* ── Hero card ── */}
				<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm overflow-hidden">
					{/* Colored top strip */}
					<div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

					<div className="p-8">
						<div className="flex items-start justify-between mb-5">
							<span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[trip.trip_type] ?? TYPE_COLORS.other}`}>
								{TYPE_LABELS[trip.trip_type] ?? trip.trip_type}
							</span>
							<div className="flex gap-2">
								<button onClick={() => navigate(`/trips/${tripId}/edit`)} className={btnSecondary}>
									Edit
								</button>
								<button
									onClick={() => setConfirmDelete(true)}
									className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 hover:border-red-300 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
								>
									Delete
								</button>
							</div>
						</div>

						<h1 className="text-4xl font-bold text-[var(--c-text)] mb-4 tracking-tight">{trip.name}</h1>

						<div className="flex flex-wrap gap-5 text-sm text-[var(--c-text3)]">
							<span>📍 {trip.destination}</span>
							<span>📅 {formatDate(trip.start_date)} → {formatDate(trip.end_date)}</span>
							{duration && <span>⏱ {duration}</span>}
							{trip.need_visa && <span className="text-amber-600 dark:text-amber-400 font-medium">🛂 Visa required</span>}
						</div>

						{confirmDelete && (
							<div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
								<p className="text-sm text-red-700 dark:text-red-400 font-medium">
									Delete this trip and all its data? This cannot be undone.
								</p>
								<div className="flex gap-2 shrink-0 ml-4">
									<button onClick={() => setConfirmDelete(false)} className={btnSecondary}>Cancel</button>
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
				</div>

				{/* ── Photos ── */}
				<SectionCard
					title="Photos"
					action={<AddBtn onClick={handlePickPhoto} label="+ Add Photo" />}
				>
					{addingPhoto && (
						<InlineForm
							onCancel={() => { setAddingPhoto(false); setPendingPath(''); setPendingCaption(''); }}
							onSave={handleConfirmPhoto}
							saving={photoSaving}
							saveLabel="Save Photo"
						>
							<p className="text-xs text-[var(--c-muted)] truncate">
								Selected: <span className="font-medium text-[var(--c-text2)]">{pendingPath.split('/').pop()}</span>
							</p>
							<input type="text" placeholder="Caption (optional)" value={pendingCaption}
								onChange={(e) => setPendingCaption(e.target.value)} className={inputCls} />
						</InlineForm>
					)}

					{photos.length === 0
						? <EmptyMsg icon="📷" text="No photos yet — add one to remember the trip!" />
						: (
							<div className="grid grid-cols-5 gap-3">
								{photos.map((photo) => {
									const url = photoURLs[photo.id];
									return (
										<div
											key={photo.id}
											className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer bg-[var(--c-hover)]"
											onClick={() => url && setLightboxId(photo.id)}
										>
											{url
												? <img src={url} alt={photo.caption} className="w-full h-full object-cover" />
												: <div className="w-full h-full flex items-center justify-center">
													<div className="w-5 h-5 border-2 border-[var(--c-border)] border-t-[var(--c-p4)] rounded-full animate-spin" />
												</div>
											}
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-end justify-between p-2">
												<button
													onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
													className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg cursor-pointer"
												>
													✕
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
						)
					}
				</SectionCard>

				{/* ── Notes | Links ── */}
				<div className="grid grid-cols-2 gap-5">

					{/* Notes */}
					<SectionCard
						title={`Notes${notes.length ? ` (${notes.length})` : ''}`}
						action={<AddBtn onClick={() => { setAddingNote(true); setEditingNoteId(null); }} label="+ Add" />}
						action2={
							<button onClick={() => navigate(`/trips/${tripId}/notes`)} className={btnSecondary} style={{ padding: '4px 12px' }}>
								Full View →
							</button>
						}
					>
						{addingNote && (
							<InlineForm
								onCancel={() => { setAddingNote(false); setNewNoteTitle(''); setNewNoteContent(''); }}
								onSave={handleAddNote}
								saving={noteSaving}
							>
								<input type="text" placeholder="Title *" value={newNoteTitle}
									onChange={(e) => setNewNoteTitle(e.target.value)} className={inputCls} />
								<textarea placeholder="Content (optional)" value={newNoteContent}
									onChange={(e) => setNewNoteContent(e.target.value)} rows={3}
									className={inputCls + ' resize-none'} />
							</InlineForm>
						)}

						{notes.length === 0 && !addingNote
							? <EmptyMsg icon="📝" text="No notes yet." />
							: (
								<div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
									{notes.map((note) =>
										editingNoteId === note.id ? (
											<InlineForm key={note.id}
												onCancel={() => setEditingNoteId(null)}
												onSave={() => handleSaveNote(note.id)}
												saving={noteSaving} saveLabel="Update"
											>
												<input type="text" value={editNoteTitle}
													onChange={(e) => setEditNoteTitle(e.target.value)} className={inputCls} />
												<textarea value={editNoteContent}
													onChange={(e) => setEditNoteContent(e.target.value)}
													rows={3} className={inputCls + ' resize-none'} />
											</InlineForm>
										) : (
											<div
												key={note.id}
												className="border border-[var(--c-border)] rounded-xl p-3 hover:border-[var(--c-border2)] transition-colors cursor-pointer"
												onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
											>
												<div className="flex items-start justify-between gap-2">
													<p className="text-sm font-medium text-[var(--c-text)] leading-snug">{note.title}</p>
													<div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
														<button className={btnSmGhost} onClick={() => { setEditingNoteId(note.id); setEditNoteTitle(note.title); setEditNoteContent(note.content); setExpandedNoteId(null); }}>Edit</button>
														<button className={btnSmDanger} onClick={() => handleDeleteNote(note.id)}>Del</button>
													</div>
												</div>
												{expandedNoteId === note.id && note.content && (
													<p className="text-sm text-[var(--c-text3)] mt-2 whitespace-pre-wrap leading-relaxed">{note.content}</p>
												)}
												{expandedNoteId !== note.id && note.content && (
													<p className="text-xs text-[var(--c-muted)] mt-1 truncate">{note.content}</p>
												)}
											</div>
										)
									)}
								</div>
							)
						}
					</SectionCard>

					{/* Links */}
					<SectionCard
						title={`Links${links.length ? ` (${links.length})` : ''}`}
						action={<AddBtn onClick={() => { setAddingLink(true); setEditingLinkId(null); setLinkError(''); }} label="+ Add" />}
						action2={
							<button onClick={() => navigate(`/trips/${tripId}/links`)} className={btnSecondary} style={{ padding: '4px 12px' }}>
								Full View →
							</button>
						}
					>
						{addingLink && (
							<InlineForm
								onCancel={() => { setAddingLink(false); setNewLinkName(''); setNewLinkUrl(''); setLinkError(''); }}
								onSave={handleAddLink}
								saving={linkSaving}
							>
								<input type="text" placeholder="Name *" value={newLinkName}
									onChange={(e) => setNewLinkName(e.target.value)} className={inputCls} />
								<input type="url" placeholder="https://..." value={newLinkUrl}
									onChange={(e) => setNewLinkUrl(e.target.value)} className={inputCls} />
								{linkError && <p className="text-xs text-red-500">{linkError}</p>}
							</InlineForm>
						)}

						{links.length === 0 && !addingLink
							? <EmptyMsg icon="🔗" text="No links yet." />
							: (
								<div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
									{links.map((link) =>
										editingLinkId === link.id ? (
											<InlineForm key={link.id}
												onCancel={() => { setEditingLinkId(null); setLinkError(''); }}
												onSave={() => handleSaveLink(link.id)}
												saving={linkSaving} saveLabel="Update"
											>
												<input type="text" value={editLinkName}
													onChange={(e) => setEditLinkName(e.target.value)} className={inputCls} />
												<input type="url" value={editLinkUrl}
													onChange={(e) => setEditLinkUrl(e.target.value)} className={inputCls} />
												{linkError && <p className="text-xs text-red-500">{linkError}</p>}
											</InlineForm>
										) : (
											<div key={link.id} className="flex items-center gap-2 border border-[var(--c-border)] rounded-xl px-3 py-2.5 hover:border-[var(--c-border2)] transition-colors">
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-[var(--c-text)] truncate">{link.name}</p>
													<p className="text-xs text-[var(--c-muted)] truncate">{link.url}</p>
												</div>
												<div className="flex gap-1.5 shrink-0">
													<button onClick={() => BrowserOpenURL(link.url)}
														className="text-xs font-medium text-[var(--c-p6)] hover:text-[var(--c-p8)] border border-[var(--c-p2)] hover:border-[var(--c-p4)] px-2 py-1 rounded-lg transition-colors cursor-pointer">
														↗
													</button>
													<button className={btnSmGhost} onClick={() => { setEditingLinkId(link.id); setEditLinkName(link.name); setEditLinkUrl(link.url); setLinkError(''); }}>Edit</button>
													<button className={btnSmDanger} onClick={() => handleDeleteLink(link.id)}>Del</button>
												</div>
											</div>
										)
									)}
								</div>
							)
						}
					</SectionCard>
				</div>

				{/* ── Itinerary preview ── */}
				<SectionCard
					title={`Itinerary${itinerary.length ? ` · ${itinerary.length} events` : ''}`}
					action={
						<button onClick={() => navigate(`/trips/${tripId}/itinerary`)} className={btnSecondary} style={{ padding: '4px 12px' }}>
							{itinerary.length === 0 ? 'Plan →' : 'Full View →'}
						</button>
					}
				>
					{itinerary.length === 0
						? <EmptyMsg icon="🗓" text="No itinerary yet — start planning your days!" />
						: (
							<div className="flex flex-col divide-y divide-[var(--c-border)] max-h-60 overflow-y-auto">
								{itinerary.map((event) => {
									const d = new Date(event.date + 'T00:00:00');
									const shortDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
									return (
										<div key={event.id} className="flex items-baseline gap-3 py-2.5 pr-1">
											<span className="text-xs text-[var(--c-muted)] shrink-0 w-24">{shortDate}</span>
											<span className="text-xs font-mono text-[var(--c-p6)] shrink-0 w-12">{event.time}</span>
											<div className="min-w-0">
												<p className="text-sm text-[var(--c-text)] font-medium truncate">{event.title}</p>
												{event.description && <p className="text-xs text-[var(--c-muted)] truncate">{event.description}</p>}
											</div>
										</div>
									);
								})}
							</div>
						)
					}
				</SectionCard>

				{/* ── Expenses summary ── */}
				<SectionCard
					title="Expenses"
					action={
						<button onClick={() => navigate(`/trips/${tripId}/expenses`)} className={btnSecondary} style={{ padding: '4px 12px' }}>
							Manage →
						</button>
					}
				>
					{expenses.length === 0
						? <EmptyMsg icon="💸" text="No expenses tracked yet." />
						: (
							<div className="flex flex-wrap gap-8 items-end">
								{Object.entries(expenseTotals).map(([currency, total]) => (
									<div key={currency}>
										<p className="text-3xl font-bold text-[var(--c-text)]">{formatCents(total, currency)}</p>
										<p className="text-xs text-[var(--c-muted)] mt-0.5">{currency} total</p>
									</div>
								))}
								<p className="text-sm text-[var(--c-muted)] ml-auto">
									{expenses.length} expense{expenses.length !== 1 ? 's' : ''}
								</p>
							</div>
						)
					}
				</SectionCard>

			</div>

			{/* ── Lightbox ── */}
			{lightboxId !== null && (
				<div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center" onClick={() => setLightboxId(null)}>
					{lightboxIdx > 0 && (
						<button className="absolute left-6 text-white/70 hover:text-white text-5xl cursor-pointer select-none"
							onClick={(e) => { e.stopPropagation(); setLightboxId(photos[lightboxIdx - 1].id); }}>‹</button>
					)}
					<div className="flex flex-col items-center gap-3 max-w-[85vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
						{photoURLs[lightboxId] && (
							<img src={photoURLs[lightboxId]} alt={lightboxPhoto?.caption}
								className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl" />
						)}
						{lightboxPhoto?.caption && <p className="text-white/80 text-sm">{lightboxPhoto.caption}</p>}
					</div>
					{lightboxIdx < photos.length - 1 && (
						<button className="absolute right-6 text-white/70 hover:text-white text-5xl cursor-pointer select-none"
							onClick={(e) => { e.stopPropagation(); setLightboxId(photos[lightboxIdx + 1].id); }}>›</button>
					)}
					<button className="absolute top-5 right-5 text-white/60 hover:text-white text-2xl cursor-pointer"
						onClick={() => setLightboxId(null)}>✕</button>
				</div>
			)}
		</div>
	);
}
