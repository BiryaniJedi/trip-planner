import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	GetTripByID,
	GetExpensesByTripId,
	CreateExpenseByTripId,
	UpdateExpenseById,
	DeleteExpenseById,
} from '../../wailsjs/go/main/App';
import { CATEGORY_ICONS, CATEGORY_LABELS, CURRENCIES, formatCents, parseCents } from '../utils';

const CATEGORIES = ['flight', 'hotel', 'car', 'festival', 'food', 'activity', 'other'];

const inputCls =
	'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--c-p3)] focus:border-[var(--c-p4)] transition';
const btnPrimary =
	'text-sm font-medium bg-[var(--c-p6)] hover:bg-[var(--c-p7)] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50';
const btnSecondary =
	'text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors cursor-pointer';

function AmountInput({ value, onChange, currency, onCurrencyChange }) {
	return (
		<div className="flex gap-2">
			<select value={currency} onChange={(e) => onCurrencyChange(e.target.value)} className={inputCls + ' w-24'}>
				{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
			</select>
			<input
				type="number"
				min="0"
				step="0.01"
				placeholder="0.00"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={inputCls}
			/>
		</div>
	);
}

function ExpenseForm({ initial, onSave, onCancel, saving }) {
	const [name, setName] = useState(initial?.name ?? '');
	const [category, setCategory] = useState(initial?.category ?? 'other');
	const [amountStr, setAmountStr] = useState(initial ? (initial.amount / 100).toFixed(2) : '');
	const [currency, setCurrency] = useState(initial?.currency ?? 'USD');
	const [note, setNote] = useState(initial?.note ?? '');

	const handleSave = () => {
		if (!name.trim()) return;
		onSave({
			name: name.trim(),
			category,
			amount: parseCents(amountStr),
			currency,
			note: note.trim(),
		});
	};

	return (
		<div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-1">
					<label className="text-xs font-medium text-slate-500">Name *</label>
					<input type="text" placeholder="e.g. Flight to Paris" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-xs font-medium text-slate-500">Category</label>
					<select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
						{CATEGORIES.map((c) => (
							<option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>
						))}
					</select>
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<label className="text-xs font-medium text-slate-500">Amount</label>
				<AmountInput value={amountStr} onChange={setAmountStr} currency={currency} onCurrencyChange={setCurrency} />
			</div>
			<div className="flex flex-col gap-1">
				<label className="text-xs font-medium text-slate-500">Note (optional)</label>
				<input type="text" placeholder="Any extra detail…" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
			</div>
			<div className="flex gap-2 justify-end pt-1">
				<button className={btnSecondary} onClick={onCancel}>Cancel</button>
				<button className={btnPrimary} onClick={handleSave} disabled={saving || !name.trim()}>
					{saving ? 'Saving…' : (initial ? 'Update' : 'Add Expense')}
				</button>
			</div>
		</div>
	);
}

export default function Expenses() {
	const { id } = useParams();
	const tripId = parseInt(id);
	const navigate = useNavigate();

	const [trip, setTrip] = useState(null);
	const [expenses, setExpenses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [showAddForm, setShowAddForm] = useState(false);
	const [addSaving, setAddSaving] = useState(false);

	const [editingId, setEditingId] = useState(null);
	const [editSaving, setEditSaving] = useState(false);

	const [confirmDeleteId, setConfirmDeleteId] = useState(null);

	useEffect(() => { loadData(); }, [tripId]);

	const loadData = async () => {
		setLoading(true);
		setError(null);
		try {
			const [tripData, expensesData] = await Promise.all([
				GetTripByID(tripId),
				GetExpensesByTripId(tripId),
			]);
			setTrip(tripData);
			setExpenses(expensesData ?? []);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	const handleAdd = async (input) => {
		setAddSaving(true);
		try {
			await CreateExpenseByTripId(tripId, input);
			setShowAddForm(false);
			const data = await GetExpensesByTripId(tripId);
			setExpenses(data ?? []);
		} catch (e) {
			alert('Failed to add expense: ' + e);
		} finally {
			setAddSaving(false);
		}
	};

	const handleUpdate = async (expenseId, input) => {
		setEditSaving(true);
		try {
			await UpdateExpenseById(expenseId, input);
			setEditingId(null);
			const data = await GetExpensesByTripId(tripId);
			setExpenses(data ?? []);
		} catch (e) {
			alert('Failed to update expense: ' + e);
		} finally {
			setEditSaving(false);
		}
	};

	const handleDelete = async (expenseId) => {
		try {
			await DeleteExpenseById(expenseId);
			setExpenses((es) => es.filter((e) => e.id !== expenseId));
			setConfirmDeleteId(null);
		} catch (e) {
			alert('Failed to delete expense: ' + e);
		}
	};

	// Totals per currency
	const totals = expenses.reduce((acc, e) => {
		acc[e.currency] = (acc[e.currency] || 0) + e.amount;
		return acc;
	}, {});

	if (loading) {
		return (
			<div className="h-full flex items-center justify-center">
				<p className="text-slate-400 text-lg">Loading…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="h-full flex flex-col items-center justify-center gap-4">
				<p className="text-red-500">{error}</p>
				<button onClick={() => navigate(`/trips/${tripId}`)} className={btnSecondary}>← Back to Trip</button>
			</div>
		);
	}

	return (
		<div className="min-h-full bg-slate-50 px-6 py-8">
			<div className="max-w-2xl mx-auto flex flex-col gap-5">

				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<button
							onClick={() => navigate(`/trips/${tripId}`)}
							className="text-slate-400 hover:text-slate-600 text-sm mb-1 flex items-center gap-1 cursor-pointer"
						>
							← {trip?.name ?? 'Trip'}
						</button>
						<h1 className="text-3xl font-bold text-slate-800">Expenses</h1>
					</div>
					<button
						onClick={() => { setShowAddForm(true); setEditingId(null); }}
						className={btnPrimary}
					>
						+ Add Expense
					</button>
				</div>

				{/* Add form */}
				{showAddForm && (
					<ExpenseForm
						onSave={handleAdd}
						onCancel={() => setShowAddForm(false)}
						saving={addSaving}
					/>
				)}

				{/* Expense list */}
				{expenses.length === 0 && !showAddForm ? (
					<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
						<p className="text-4xl mb-3">💸</p>
						<p className="text-slate-500 font-medium">No expenses yet.</p>
						<p className="text-slate-400 text-sm mt-1">Hit "+ Add Expense" to start tracking.</p>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{expenses.map((expense) =>
							editingId === expense.id ? (
								<ExpenseForm
									key={expense.id}
									initial={expense}
									onSave={(input) => handleUpdate(expense.id, input)}
									onCancel={() => setEditingId(null)}
									saving={editSaving}
								/>
							) : (
								<div key={expense.id} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
									{confirmDeleteId === expense.id ? (
										<div className="flex items-center justify-between">
											<p className="text-sm text-red-600 font-medium">Delete this expense?</p>
											<div className="flex gap-2">
												<button onClick={() => setConfirmDeleteId(null)} className={btnSecondary} style={{ padding: '4px 12px' }}>Cancel</button>
												<button
													onClick={() => handleDelete(expense.id)}
													className="text-sm px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer"
												>
													Delete
												</button>
											</div>
										</div>
									) : (
										<div className="flex items-center gap-3">
											<span className="text-2xl shrink-0">{CATEGORY_ICONS[expense.category] ?? '📦'}</span>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold text-slate-800">{expense.name}</p>
												{expense.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{expense.note}</p>}
											</div>
											<div className="text-right shrink-0">
												<p className="text-base font-bold text-slate-800">{formatCents(expense.amount, expense.currency)}</p>
												<p className="text-xs text-slate-400">{CATEGORY_LABELS[expense.category]}</p>
											</div>
											<div className="flex gap-2 ml-2 shrink-0">
												<button
													onClick={() => { setEditingId(expense.id); setShowAddForm(false); }}
													className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
												>
													Edit
												</button>
												<button
													onClick={() => setConfirmDeleteId(expense.id)}
													className="text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors"
												>
													Delete
												</button>
											</div>
										</div>
									)}
								</div>
							)
						)}
					</div>
				)}

				{/* Totals footer */}
				{expenses.length > 0 && (
					<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
						<p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Total Spent</p>
						<div className="flex flex-wrap gap-6">
							{Object.entries(totals).map(([currency, total]) => (
								<div key={currency}>
									<p className="text-2xl font-bold text-slate-800">{formatCents(total, currency)}</p>
									<p className="text-xs text-slate-400">{currency}</p>
								</div>
							))}
						</div>
					</div>
				)}

			</div>
		</div>
	);
}
