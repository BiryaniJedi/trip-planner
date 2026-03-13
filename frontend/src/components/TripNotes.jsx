import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	GetTripByID,
	GetNotesByTripId,
	CreateNoteByTripId,
	UpdateNoteById,
	DeleteNoteById,
} from '../../wailsjs/go/main/App';

const inputCls =
	'w-full border border-[var(--c-border)] rounded-lg px-3 py-2 text-sm text-[var(--c-text)] bg-[var(--c-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-p3)] focus:border-[var(--c-p4)] transition placeholder:text-[var(--c-muted)]';
const btnPrimary =
	'text-sm font-medium bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50';
const btnSecondary =
	'text-sm font-medium border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-[var(--c-hover)] px-4 py-2 rounded-lg transition-colors cursor-pointer';

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

export default function TripNotes() {
	const { id } = useParams();
	const tripId = parseInt(id);
	const navigate = useNavigate();

	const [trip, setTrip] = useState(null);
	const [notes, setNotes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [showAddForm, setShowAddForm] = useState(false);
	const [addSaving, setAddSaving] = useState(false);
	const [newTitle, setNewTitle] = useState('');
	const [newContent, setNewContent] = useState('');

	const [editingId, setEditingId] = useState(null);
	const [editSaving, setEditSaving] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editContent, setEditContent] = useState('');

	const [expandedId, setExpandedId] = useState(null);

	useEffect(() => { loadData(); }, [tripId]);

	const loadData = async () => {
		setLoading(true);
		setError(null);
		try {
			const [tripData, notesData] = await Promise.all([
				GetTripByID(tripId),
				GetNotesByTripId(tripId),
			]);
			setTrip(tripData);
			setNotes(notesData ?? []);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	const handleAdd = async () => {
		if (!newTitle.trim()) return;
		setAddSaving(true);
		try {
			await CreateNoteByTripId(tripId, { title: newTitle.trim(), content: newContent.trim() });
			setShowAddForm(false);
			setNewTitle('');
			setNewContent('');
			const data = await GetNotesByTripId(tripId);
			setNotes(data ?? []);
		} catch (e) {
			alert('Failed to add note: ' + e);
		} finally {
			setAddSaving(false);
		}
	};

	const startEdit = (note) => {
		setEditingId(note.id);
		setEditTitle(note.title);
		setEditContent(note.content);
		setExpandedId(null);
	};

	const handleUpdate = async (noteId) => {
		if (!editTitle.trim()) return;
		setEditSaving(true);
		try {
			await UpdateNoteById(noteId, { title: editTitle.trim(), content: editContent.trim() });
			setEditingId(null);
			const data = await GetNotesByTripId(tripId);
			setNotes(data ?? []);
		} catch (e) {
			alert('Failed to update note: ' + e);
		} finally {
			setEditSaving(false);
		}
	};

	const handleDelete = async (noteId) => {
		try {
			await DeleteNoteById(noteId);
			setNotes((prev) => prev.filter((n) => n.id !== noteId));
			if (expandedId === noteId) setExpandedId(null);
			if (editingId === noteId) setEditingId(null);
		} catch (e) {
			alert('Failed to delete note: ' + e);
		}
	};

	if (loading) return <PageSpinner />;

	if (error) {
		return (
			<div className="h-full flex flex-col items-center justify-center gap-4">
				<p className="text-red-500">{error}</p>
				<button onClick={() => navigate(`/trips/${tripId}`)} className={btnSecondary}>
					← Back to Trip
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-full bg-[var(--c-bg)] px-6 py-8 page-in">
			<div className="max-w-3xl mx-auto flex flex-col gap-5">

				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<button
							onClick={() => navigate(`/trips/${tripId}`)}
							className="text-[var(--c-muted)] hover:text-[var(--c-text2)] text-sm mb-1 flex items-center gap-1 cursor-pointer transition-colors"
						>
							← {trip?.name ?? 'Trip'}
						</button>
						<h1 className="text-3xl font-bold text-[var(--c-text)]">Notes</h1>
					</div>
					<button
						onClick={() => { setShowAddForm(true); setEditingId(null); }}
						className={btnPrimary}
					>
						+ Add Note
					</button>
				</div>

				{/* Add form */}
				{showAddForm && (
					<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm p-5 flex flex-col gap-3">
						<h3 className="text-sm font-semibold text-[var(--c-text)]">New Note</h3>
						<div className="flex flex-col gap-1">
							<label className="text-xs font-medium text-[var(--c-muted)]">Title *</label>
							<input
								type="text"
								placeholder="e.g. Visa requirements"
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								className={inputCls}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-xs font-medium text-[var(--c-muted)]">Content (optional)</label>
							<textarea
								placeholder="Write your note here…"
								value={newContent}
								onChange={(e) => setNewContent(e.target.value)}
								rows={4}
								className={inputCls + ' resize-none'}
							/>
						</div>
						<div className="flex gap-2 justify-end pt-1">
							<button
								className={btnSecondary}
								onClick={() => { setShowAddForm(false); setNewTitle(''); setNewContent(''); }}
							>
								Cancel
							</button>
							<button
								className={btnPrimary}
								onClick={handleAdd}
								disabled={addSaving || !newTitle.trim()}
							>
								{addSaving ? 'Saving…' : 'Add Note'}
							</button>
						</div>
					</div>
				)}

				{/* Empty state */}
				{notes.length === 0 && !showAddForm && (
					<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm p-10 text-center">
						<p className="text-4xl mb-3">📝</p>
						<p className="text-[var(--c-text2)] font-medium">No notes yet.</p>
						<p className="text-[var(--c-muted)] text-sm mt-1">
							Hit "+ Add Note" to start capturing information.
						</p>
					</div>
				)}

				{/* Notes list */}
				{notes.length > 0 && (
					<div className="flex flex-col gap-3">
						{notes.map((note) =>
							editingId === note.id ? (
								<div
									key={note.id}
									className="bg-[var(--c-card)] rounded-xl border border-[var(--c-border)] shadow-sm p-4 flex flex-col gap-3"
								>
									<input
										type="text"
										value={editTitle}
										onChange={(e) => setEditTitle(e.target.value)}
										className={inputCls}
									/>
									<textarea
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										rows={4}
										className={inputCls + ' resize-none'}
									/>
									<div className="flex gap-2 justify-end">
										<button className={btnSecondary} onClick={() => setEditingId(null)}>
											Cancel
										</button>
										<button
											className={btnPrimary}
											onClick={() => handleUpdate(note.id)}
											disabled={editSaving || !editTitle.trim()}
										>
											{editSaving ? 'Saving…' : 'Update'}
										</button>
									</div>
								</div>
							) : (
								<div
									key={note.id}
									className="bg-[var(--c-card)] rounded-xl border border-[var(--c-border)] shadow-sm px-4 py-3 cursor-pointer hover:border-[var(--c-border2)] transition-colors"
									onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
								>
									<div className="flex items-start justify-between gap-2">
										<p className="text-sm font-semibold text-[var(--c-text)] leading-snug">
											{note.title}
										</p>
										<div className="flex gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
											<button
												className="text-xs text-[var(--c-muted)] hover:text-[var(--c-text2)] cursor-pointer transition-colors"
												onClick={() => startEdit(note)}
											>
												Edit
											</button>
											<button
												className="text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors"
												onClick={() => handleDelete(note.id)}
											>
												Delete
											</button>
										</div>
									</div>
									{note.content && expandedId !== note.id && (
										<p className="text-xs text-[var(--c-muted)] mt-1 truncate">{note.content}</p>
									)}
									{note.content && expandedId === note.id && (
										<p className="text-sm text-[var(--c-text2)] mt-2 whitespace-pre-wrap leading-relaxed">
											{note.content}
										</p>
									)}
								</div>
							)
						)}
					</div>
				)}

			</div>
		</div>
	);
}
