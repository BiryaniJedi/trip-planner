import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	GetTripByID,
	GetLinksByTripId,
	CreateLinkByTripId,
	UpdateLinkById,
	DeleteLinkById,
} from '../../wailsjs/go/main/App';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

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

export default function TripLinks() {
	const { id } = useParams();
	const tripId = parseInt(id);
	const navigate = useNavigate();

	const [trip, setTrip] = useState(null);
	const [links, setLinks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [showAddForm, setShowAddForm] = useState(false);
	const [addSaving, setAddSaving] = useState(false);
	const [newName, setNewName] = useState('');
	const [newUrl, setNewUrl] = useState('');
	const [addError, setAddError] = useState('');

	const [editingId, setEditingId] = useState(null);
	const [editSaving, setEditSaving] = useState(false);
	const [editName, setEditName] = useState('');
	const [editUrl, setEditUrl] = useState('');
	const [editError, setEditError] = useState('');

	useEffect(() => { loadData(); }, [tripId]);

	const loadData = async () => {
		setLoading(true);
		setError(null);
		try {
			const [tripData, linksData] = await Promise.all([
				GetTripByID(tripId),
				GetLinksByTripId(tripId),
			]);
			setTrip(tripData);
			setLinks(linksData ?? []);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	const handleAdd = async () => {
		setAddError('');
		if (!newName.trim() || !newUrl.trim()) {
			setAddError('Name and URL are required.');
			return;
		}
		setAddSaving(true);
		try {
			await CreateLinkByTripId(tripId, { name: newName.trim(), url: newUrl.trim() });
			setShowAddForm(false);
			setNewName('');
			setNewUrl('');
			const data = await GetLinksByTripId(tripId);
			setLinks(data ?? []);
		} catch (e) {
			setAddError(String(e));
		} finally {
			setAddSaving(false);
		}
	};

	const startEdit = (link) => {
		setEditingId(link.id);
		setEditName(link.name);
		setEditUrl(link.url);
		setEditError('');
	};

	const handleUpdate = async (linkId) => {
		setEditError('');
		if (!editName.trim() || !editUrl.trim()) {
			setEditError('Name and URL are required.');
			return;
		}
		setEditSaving(true);
		try {
			await UpdateLinkById(linkId, { name: editName.trim(), url: editUrl.trim() });
			setEditingId(null);
			const data = await GetLinksByTripId(tripId);
			setLinks(data ?? []);
		} catch (e) {
			setEditError(String(e));
		} finally {
			setEditSaving(false);
		}
	};

	const handleDelete = async (linkId) => {
		try {
			await DeleteLinkById(linkId);
			setLinks((prev) => prev.filter((l) => l.id !== linkId));
			if (editingId === linkId) setEditingId(null);
		} catch (e) {
			alert('Failed to delete link: ' + e);
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
						<h1 className="text-3xl font-bold text-[var(--c-text)]">Links</h1>
					</div>
					<button
						onClick={() => { setShowAddForm(true); setEditingId(null); setAddError(''); }}
						className={btnPrimary}
					>
						+ Add Link
					</button>
				</div>

				{/* Add form */}
				{showAddForm && (
					<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm p-5 flex flex-col gap-3">
						<h3 className="text-sm font-semibold text-[var(--c-text)]">New Link</h3>
						<div className="flex flex-col gap-1">
							<label className="text-xs font-medium text-[var(--c-muted)]">Name *</label>
							<input
								type="text"
								placeholder="e.g. Japan Rail Pass"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								className={inputCls}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-xs font-medium text-[var(--c-muted)]">URL *</label>
							<input
								type="url"
								placeholder="https://..."
								value={newUrl}
								onChange={(e) => setNewUrl(e.target.value)}
								className={inputCls}
							/>
						</div>
						{addError && <p className="text-xs text-red-500">{addError}</p>}
						<div className="flex gap-2 justify-end pt-1">
							<button
								className={btnSecondary}
								onClick={() => { setShowAddForm(false); setNewName(''); setNewUrl(''); setAddError(''); }}
							>
								Cancel
							</button>
							<button className={btnPrimary} onClick={handleAdd} disabled={addSaving}>
								{addSaving ? 'Saving…' : 'Add Link'}
							</button>
						</div>
					</div>
				)}

				{/* Empty state */}
				{links.length === 0 && !showAddForm && (
					<div className="bg-[var(--c-card)] rounded-2xl border border-[var(--c-border)] shadow-sm p-10 text-center">
						<p className="text-4xl mb-3">🔗</p>
						<p className="text-[var(--c-text2)] font-medium">No links yet.</p>
						<p className="text-[var(--c-muted)] text-sm mt-1">
							Hit "+ Add Link" to save useful URLs for this trip.
						</p>
					</div>
				)}

				{/* Links list */}
				{links.length > 0 && (
					<div className="flex flex-col gap-3">
						{links.map((link) =>
							editingId === link.id ? (
								<div
									key={link.id}
									className="bg-[var(--c-card)] rounded-xl border border-[var(--c-border)] shadow-sm p-4 flex flex-col gap-3"
								>
									<input
										type="text"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										className={inputCls}
									/>
									<input
										type="url"
										value={editUrl}
										onChange={(e) => setEditUrl(e.target.value)}
										className={inputCls}
									/>
									{editError && <p className="text-xs text-red-500">{editError}</p>}
									<div className="flex gap-2 justify-end">
										<button
											className={btnSecondary}
											onClick={() => { setEditingId(null); setEditError(''); }}
										>
											Cancel
										</button>
										<button
											className={btnPrimary}
											onClick={() => handleUpdate(link.id)}
											disabled={editSaving}
										>
											{editSaving ? 'Saving…' : 'Update'}
										</button>
									</div>
								</div>
							) : (
								<div
									key={link.id}
									className="bg-[var(--c-card)] rounded-xl border border-[var(--c-border)] shadow-sm px-4 py-3 flex items-center gap-3 hover:border-[var(--c-border2)] transition-colors"
								>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-[var(--c-text)] truncate">{link.name}</p>
										<p className="text-xs text-[var(--c-muted)] truncate mt-0.5">{link.url}</p>
									</div>
									<div className="flex gap-2 shrink-0">
										<button
											onClick={() => BrowserOpenURL(link.url)}
											className="text-xs font-medium text-[var(--c-p6)] hover:text-[var(--c-p8)] border border-[var(--c-p2)] hover:border-[var(--c-p4)] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
										>
											Open ↗
										</button>
										<button
											className="text-xs text-[var(--c-muted)] hover:text-[var(--c-text2)] cursor-pointer transition-colors"
											onClick={() => startEdit(link)}
										>
											Edit
										</button>
										<button
											className="text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors"
											onClick={() => handleDelete(link.id)}
										>
											Delete
										</button>
									</div>
								</div>
							)
						)}
					</div>
				)}

			</div>
		</div>
	);
}
