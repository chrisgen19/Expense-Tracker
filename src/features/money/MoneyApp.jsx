import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Utensils,
  Car,
  ShoppingCart,
  Lightbulb,
  Home,
  HeartPulse,
  ShoppingBag,
  Ticket,
  MoreHorizontal,
  LoaderCircle,
  X,
  LogOut,
  Users,
  UserPlus,
  Heart,
  Trash2,
  Pencil,
  Lock,
  Wallet,
  Banknote,
  TrendingUp,
  Eye, 
  EyeOff
} from "lucide-react";

// --- Helpers & Constants ---
const ACCOUNTS = ["gcash", "debit card", "cash", "credit card"];
const EXPENSE_CATEGORIES = [
  "food",
  "transpo",
  "grocery",
  "utilities",
  "rent",
  "health",
  "shopping",
  "entertainment",
  "other",
];
const INCOME_CATEGORIES = [
  "salary",
  "bonus",
  "freelance",
  "investment",
  "gift",
  "other",
];

// A map for category icons for better visual distinction
const expenseIcons = {
  food: <Utensils className="size-5" />,
  transpo: <Car className="size-5" />,
  grocery: <ShoppingCart className="size-5" />,
  utilities: <Lightbulb className="size-5" />,
  rent: <Home className="size-5" />,
  health: <HeartPulse className="size-5" />,
  shopping: <ShoppingBag className="size-5" />,
  entertainment: <Ticket className="size-5" />,
  other: <MoreHorizontal className="size-5" />,
};

const incomeIcons = {
  salary: <Wallet className="size-5" />,
  bonus: <Banknote className="size-5" />,
  freelance: <UserPlus className="size-5" />,
  investment: <TrendingUp className="size-5" />,
  gift: <Heart className="size-5" />,
  other: <MoreHorizontal className="size-5" />,
};

// --- Helper Functions ---
function firstDayOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function toISODate(d) {
  return d.toISOString();
}
function toLocalDatetimeInputValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}
function phpCurrency(n) {
  return Number(n || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "PHP",
  });
}

// Mask a pre-formatted currency string by replacing digits with a character.
// Example: "₱12,345.67" -> "₱**,***.**"
function maskCurrencyString(formatted, { dropDecimals = false, maskChar = "*" } = {}) {
  let s = formatted;
  if (dropDecimals) s = s.replace(/[.,]\d+$/, ""); // optionally drop decimals entirely
  return s.replace(/\d/g, maskChar);
}

// Persist the user's net-privacy choice per user id
const NET_PRIVACY_KEY = (uid) => `moneyapp:net-privacy:${uid}`;

// Key like "2025-08-19" from an ISO string or Date
function ymdKeyFromISO(dt) {
  const d = new Date(dt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabelFromKey(key) {
  const [y, m, d] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(dt);
}

// --- Spouse Management Modal ---
function SpouseModal({ isOpen, onClose, user, spouseConnection, onSpouseUpdate }) {
  const [spouseEmail, setSpouseEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddSpouse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (spouseEmail.toLowerCase() === user.email.toLowerCase()) {
      setError("You cannot add yourself as a spouse!");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("spouse_connections")
        .insert({ user_id: user.id, spouse_email: spouseEmail.trim().toLowerCase() });

      if (error) throw error;

      onSpouseUpdate();
      setSpouseEmail("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add spouse");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSpouse = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from("spouse_connections").delete().eq("user_id", user.id);

      if (error) throw error;

      onSpouseUpdate();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to remove spouse");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="size-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <Heart className="size-6 text-red-500" />
          <h2 className="text-xl font-bold">Spouse Management</h2>
        </div>

        {spouseConnection ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Users className="size-5" />
                <span className="font-medium">Connected to:</span>
              </div>
              <p className="text-green-700 mt-1">{spouseConnection.spouse_email}</p>
              {spouseConnection.spouse_user_id && (
                <p className="text-sm text-green-600 mt-1">✓ Active account found</p>
              )}
            </div>

            <button
              onClick={handleRemoveSpouse}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {loading ? "Removing..." : "Remove Spouse Connection"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddSpouse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Spouse Email Address</label>
              <input
                type="email"
                value={spouseEmail}
                onChange={(e) => setSpouseEmail(e.target.value)}
                placeholder="spouse@email.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your expenses & income will be combined automatically. No confirmation needed.
              </p>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {loading ? "Adding..." : "Add Spouse"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function MonthNavigator({ viewMonth, setViewMonth, nextMonthDisabled, monthLabel }) {
  const gotoPrevMonth = () => setViewMonth((m) => addMonths(m, -1));
  const gotoNextMonth = () => !nextMonthDisabled && setViewMonth((m) => addMonths(m, 1));
  const gotoCurrentMonth = () => setViewMonth(firstDayOfMonth(new Date()));

  return (
    <div className="flex items-center gap-2">
      <button onClick={gotoPrevMonth} className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors">
        <ChevronLeft className="size-5" />
      </button>
      <button onClick={gotoCurrentMonth} className="px-3 py-2 text-sm font-semibold rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors">
        {monthLabel}
      </button>
      <button
        onClick={gotoNextMonth}
        disabled={nextMonthDisabled}
        className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

// =====================
// Lists & Items
// =====================
function ExpenseList({ groups, loading, error, monthLabel, currentUserId, onEdit, onDelete, isNetHidden }) {
  const [collapsed, setCollapsed] = useState({});
  const toggle = (k) => setCollapsed((p) => ({ ...p, [k]: !p[k] }));

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 bg-white rounded-2xl shadow-sm">
        <LoaderCircle className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (error) {
    return <div className="p-6 bg-white rounded-2xl shadow-sm text-red-600">{error}</div>;
  }
  if (!groups?.length) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
        <p>No expenses for {monthLabel} yet.</p>
        <p className="text-sm mt-1">Click "Add Expense" to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const netText = isNetHidden
          ? maskCurrencyString(phpCurrency(g.endBalance), { dropDecimals: true, maskChar: "*" })
          : phpCurrency(g.endBalance);

        return (
          <section key={g.key} className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
            {/* Day header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggle(g.key)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition"
                  title={collapsed[g.key] ? "Expand" : "Collapse"}
                >
                  <ChevronRight
                    className={`size-4 text-gray-600 transition-transform ${collapsed[g.key] ? "" : "rotate-90"}`}
                  />
                </button>
                <div className="font-semibold text-gray-800">{g.label}</div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-gray-600">
                  In: <span className="font-semibold text-emerald-700">{phpCurrency(g.incomeToday)}</span>
                </div>
                <div className="text-gray-600">
                  Spent: <span className="font-semibold text-blue-700">{phpCurrency(g.spentToday)}</span>
                </div>
                <div className="text-gray-600">
                  Start: <span className="font-semibold">{phpCurrency(g.startBalance)}</span>
                </div>
                <div className={`font-semibold ${g.endBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  Net: {netText}
                </div>
              </div>
            </div>

            {/* Rows */}
            {!collapsed[g.key] && (
              <div className="p-3 space-y-3">
                {g.items.map((e) => (
                  <RowCard
                    key={e.id}
                    row={e}
                    currentUserId={currentUserId}
                    icons={expenseIcons}
                    kind="expense"
                    onEdit={() => onEdit(e)}
                    onDelete={() => onDelete(e.id)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function IncomeList({ groups, loading, error, monthLabel, currentUserId, onEdit, onDelete, isNetHidden }) {
  const [collapsed, setCollapsed] = useState({});
  const toggle = (k) => setCollapsed((p) => ({ ...p, [k]: !p[k] }));

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 bg-white rounded-2xl shadow-sm">
        <LoaderCircle className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (error) {
    return <div className="p-6 bg-white rounded-2xl shadow-sm text-red-600">{error}</div>;
  }
  if (!groups?.length) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
        <p>No income for {monthLabel} yet.</p>
        <p className="text-sm mt-1">Click "Add Income" to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const netText = isNetHidden
          ? maskCurrencyString(phpCurrency(g.endBalance), { dropDecimals: true, maskChar: "*" })
          : phpCurrency(g.endBalance);

        return (
          <section key={g.key} className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
            {/* Day header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggle(g.key)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition"
                  title={collapsed[g.key] ? "Expand" : "Collapse"}
                >
                  <ChevronRight
                    className={`size-4 text-gray-600 transition-transform ${collapsed[g.key] ? "" : "rotate-90"}`}
                  />
                </button>
                <div className="font-semibold text-gray-800">{g.label}</div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-gray-600">
                  In: <span className="font-semibold text-emerald-700">{phpCurrency(g.incomeToday)}</span>
                </div>
                <div className="text-gray-600">
                  Spent: <span className="font-semibold text-blue-700">{phpCurrency(g.spentToday)}</span>
                </div>
                <div className="text-gray-600">
                  Start: <span className="font-semibold">{phpCurrency(g.startBalance)}</span>
                </div>
                <div className={`font-semibold ${g.endBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  Net: {netText}
                </div>
              </div>
            </div>

            {/* Rows */}
            {!collapsed[g.key] && (
              <div className="p-3 space-y-3">
                {g.items.map((i) => (
                  <RowCard
                    key={i.id}
                    row={i}
                    currentUserId={currentUserId}
                    icons={incomeIcons}
                    kind="income"
                    onEdit={() => onEdit(i)}
                    onDelete={() => onDelete(i.id)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function RowCard({ row, currentUserId, icons, kind, onEdit, onDelete }) {
  const { id, user_id, amount, account, category, note, created_at, is_spouse, spouse_email } = row;
  const date = new Date(created_at);
  const canManage = user_id === currentUserId;

  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 ${is_spouse ? "border-l-4 border-red-200" : ""}`}>
      <div className={`${is_spouse ? "bg-red-100 text-red-600" : kind === "income" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-600"} p-3 rounded-full`}>
        {icons[category] || <MoreHorizontal className="size-5" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold capitalize text-gray-800">{note || category}</p>
          {is_spouse && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{spouse_email}</span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {date.toLocaleDateString(undefined, { day: "numeric", month: "short" })} • <span className="capitalize">{account}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-gray-900">{phpCurrency(parseFloat(String(amount)))}</p>
        <p className="text-xs text-gray-400">{date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>

        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            className={`p-2 rounded-lg ${canManage ? "bg-white hover:bg-gray-100" : "bg-gray-50 opacity-60 cursor-not-allowed"} shadow-sm transition-colors`}
            title={canManage ? "Edit" : "You can't edit spouse entries"}
            onClick={() => canManage && onEdit()}
            disabled={!canManage}
          >
            {canManage ? <Pencil className="size-4" /> : <Lock className="size-4" />}
          </button>
          <button
            className={`p-2 rounded-lg ${canManage ? "bg-white hover:bg-gray-100" : "bg-gray-50 opacity-60 cursor-not-allowed"} shadow-sm transition-colors`}
            title={canManage ? "Delete" : "You can't delete spouse entries"}
            onClick={() => canManage && onDelete()}
            disabled={!canManage}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// Modals
// =====================
function ExpenseFormModal({ isOpen, onClose, onAdd }) {
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("gcash");
  const [category, setCategory] = useState("food");
  const [dt, setDt] = useState(toLocalDatetimeInputValue());
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setAccount("gcash");
      setCategory("food");
      setDt(toLocalDatetimeInputValue());
      setNote("");
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Amount must be a positive number.");
      setSubmitting(false);
      return;
    }
    try {
      const payload = {
        amount: amt,
        account,
        category,
        note: note || null,
        created_at: new Date(dt).toISOString(),
      };
      const { data, error } = await supabase.from("expenses").insert(payload).select();
      if (error) throw error;
      onAdd(data[0]);
    } catch (err) {
      setError(err.message || "Failed to add expense.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <ModalShell title="Add New Expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <NumberField label="Amount" value={amount} onChange={setAmount} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Account" value={account} onChange={setAccount} options={ACCOUNTS} />
          <SelectField label="Category" value={category} onChange={setCategory} options={EXPENSE_CATEGORIES} />
        </div>
        <DatetimeField label="Date & Time" value={dt} onChange={setDt} />
        <TextareaField label="Note (Optional)" value={note} onChange={setNote} placeholder="e.g., Lunch with team" />
        <SubmitRow submitting={submitting} error={error} submitLabel="Add Expense" />
      </form>
    </ModalShell>
  );
}

function EditExpenseModal({ isOpen, expense, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("gcash");
  const [category, setCategory] = useState("food");
  const [dt, setDt] = useState(toLocalDatetimeInputValue());
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && expense) {
      setAmount(String(expense.amount ?? ""));
      setAccount(expense.account ?? "gcash");
      setCategory(expense.category ?? "food");
      setDt(toLocalDatetimeInputValue(new Date(expense.created_at)));
      setNote(expense.note ?? "");
      setError(null);
    }
  }, [isOpen, expense]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Amount must be a positive number.");
      setSubmitting(false);
      return;
    }
    try {
      const payload = {
        amount: amt,
        account,
        category,
        note: note || null,
        created_at: new Date(dt).toISOString(),
      };
      const { data, error } = await supabase.from("expenses").update(payload).eq("id", expense.id).select().single();
      if (error) throw error;
      onSave(data);
    } catch (err) {
      setError(err.message || "Failed to update expense.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <ModalShell title="Edit Expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <NumberField label="Amount" value={amount} onChange={setAmount} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Account" value={account} onChange={setAccount} options={ACCOUNTS} />
          <SelectField label="Category" value={category} onChange={setCategory} options={EXPENSE_CATEGORIES} />
        </div>
        <DatetimeField label="Date & Time" value={dt} onChange={setDt} />
        <TextareaField label="Note (Optional)" value={note} onChange={setNote} placeholder="e.g., Lunch with team" />
        <SubmitRow submitting={submitting} error={error} submitLabel="Save Changes" />
      </form>
    </ModalShell>
  );
}

function IncomeFormModal({ isOpen, onClose, onAdd, userId }) {
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("gcash");
  const [category, setCategory] = useState("salary");
  const [dt, setDt] = useState(toLocalDatetimeInputValue());
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setAccount("gcash");
      setCategory("salary");
      setDt(toLocalDatetimeInputValue());
      setNote("");
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Amount must be a positive number.");
      setSubmitting(false);
      return;
    }
    try {
      const payload = {
        user_id: userId, // ensure RLS passes
        amount: amt,
        account,
        category,
        note: note || null,
        created_at: new Date(dt).toISOString(),
      };
      const { data, error } = await supabase.from("incomes").insert(payload).select();
      if (error) throw error;
      onAdd(data[0]);
    } catch (err) {
      setError(err.message || "Failed to add income.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <ModalShell title="Add Income" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <NumberField label="Amount" value={amount} onChange={setAmount} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Account" value={account} onChange={setAccount} options={ACCOUNTS} />
          <SelectField label="Category" value={category} onChange={setCategory} options={INCOME_CATEGORIES} />
        </div>
        <DatetimeField label="Date & Time" value={dt} onChange={setDt} />
        <TextareaField label="Note (Optional)" value={note} onChange={setNote} placeholder="e.g., Salary for Aug 15" />
        <SubmitRow submitting={submitting} error={error} submitLabel="Add Income" buttonClass="bg-green-600 hover:bg-green-700 focus:ring-green-500 disabled:bg-green-400" />
      </form>
    </ModalShell>
  );
}

function EditIncomeModal({ isOpen, income, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("gcash");
  const [category, setCategory] = useState("salary");
  const [dt, setDt] = useState(toLocalDatetimeInputValue());
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && income) {
      setAmount(String(income.amount ?? ""));
      setAccount(income.account ?? "gcash");
      setCategory(income.category ?? "salary");
      setDt(toLocalDatetimeInputValue(new Date(income.created_at)));
      setNote(income.note ?? "");
      setError(null);
    }
  }, [isOpen, income]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Amount must be a positive number.");
      setSubmitting(false);
      return;
    }
    try {
      const payload = {
        amount: amt,
        account,
        category,
        note: note || null,
        created_at: new Date(dt).toISOString(),
      };
      const { data, error } = await supabase.from("incomes").update(payload).eq("id", income.id).select().single();
      if (error) throw error;
      onSave(data);
    } catch (err) {
      setError(err.message || "Failed to update income.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <ModalShell title="Edit Income" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <NumberField label="Amount" value={amount} onChange={setAmount} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Account" value={account} onChange={setAccount} options={ACCOUNTS} />
          <SelectField label="Category" value={category} onChange={setCategory} options={INCOME_CATEGORIES} />
        </div>
        <DatetimeField label="Date & Time" value={dt} onChange={setDt} />
        <TextareaField label="Note (Optional)" value={note} onChange={setNote} placeholder="e.g., Salary for Aug 15" />
        <SubmitRow submitting={submitting} error={error} submitLabel="Save Changes" buttonClass="bg-green-600 hover:bg-green-700 focus:ring-green-500 disabled:bg-green-400" />
      </form>
    </ModalShell>
  );
}

// =====================
// UI primitives
// =====================
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="size-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        required
        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="capitalize">
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function DatetimeField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 min-h-[60px]"
      />
    </label>
  );
}

function SubmitRow({ submitting, error, submitLabel, buttonClass }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="submit"
        disabled={submitting}
        className={`inline-flex items-center px-4 py-2 rounded-lg text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
          buttonClass || "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400"
        }`}
      >
        {submitting && <LoaderCircle className="size-4 animate-spin mr-2" />}
        {submitting ? "Saving..." : submitLabel}
      </button>
      {error && <div className="text-sm text-red-600 text-right">{error}</div>}
    </div>
  );
}

// --- Main Money App Component ---
export default function MoneyApp({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState("expenses"); // "expenses" | "income"
  const [viewMonth, setViewMonth] = useState(firstDayOfMonth(new Date()));

  // Spouse modal
  const [isSpouseModalOpen, setIsSpouseModalOpen] = useState(false);

  // Expenses state
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [errorExpenses, setErrorExpenses] = useState(null);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Income state
  const [incomes, setIncomes] = useState([]);
  const [loadingIncome, setLoadingIncome] = useState(true);
  const [errorIncome, setErrorIncome] = useState(null);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  // Spouse
  const [spouseConnection, setSpouseConnection] = useState(null);

// Privacy toggle for net income (persisted per user)
// Initialize from localStorage BEFORE first paint
const [isNetHidden, setIsNetHidden] = useState(() => {
  try {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(NET_PRIVACY_KEY(user.id)) === "1";
  } catch {
    return false;
  }
});

// Persist whenever it changes
useEffect(() => {
  try {
    localStorage.setItem(NET_PRIVACY_KEY(user.id), isNetHidden ? "1" : "0");
  } catch {}
}, [user.id, isNetHidden]);

  const nextMonthDisabled = useMemo(
    () => addMonths(viewMonth, 1) > firstDayOfMonth(new Date()),
    [viewMonth]
  );
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(viewMonth),
    [viewMonth]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0),
    [expenses]
  );
  const totalIncome = useMemo(
    () => incomes.reduce((sum, i) => sum + parseFloat(String(i.amount || 0)), 0),
    [incomes]
  );
  const net = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  // Income per day (includes spouse, since you already merged into `incomes`)
  const incomeByDay = useMemo(() => {
    const m = new Map();
    for (const i of incomes) {
      const k = ymdKeyFromISO(i.created_at);
      const amt = parseFloat(String(i.amount || 0));
      m.set(k, (m.get(k) || 0) + (Number.isFinite(amt) ? amt : 0));
    }
    return m;
  }, [incomes]);

  // Group expenses by day and compute daily balances:
  // startBalance (after today's income, before spending) and endBalance (start - spentToday)
  const expenseGroups = useMemo(() => {
    const buckets = new Map();      // dayKey -> expense rows
    const expenseByDay = new Map(); // dayKey -> sum of today's expenses

    for (const e of expenses) {
      const k = ymdKeyFromISO(e.created_at);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(e);
      const amt = parseFloat(String(e.amount || 0));
      expenseByDay.set(k, (expenseByDay.get(k) || 0) + (Number.isFinite(amt) ? amt : 0));
    }

    // Sort each day's items (newest first)
    for (const arr of buckets.values()) {
      arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Build sections in ascending date to maintain running totals,
    // then render newest first
    const allKeys = new Set([...buckets.keys(), ...incomeByDay.keys()]);
    const keysAsc = Array.from(allKeys).sort(); // "YYYY-MM-DD"

    let cumIncome = 0;
    let cumExpenses = 0;
    const sectionsByKey = new Map();

    for (const k of keysAsc) {
      const incToday = incomeByDay.get(k) || 0;
      cumIncome += incToday;

      const spentToday = expenseByDay.get(k) || 0;

      const startBalance = cumIncome - cumExpenses; // before spending today
      const endBalance = startBalance - spentToday; // after spending today

      cumExpenses += spentToday;

      if (buckets.has(k)) {
        sectionsByKey.set(k, {
          key: k,
          label: formatDayLabelFromKey(k),
          items: buckets.get(k),
          incomeToday: incToday,
          spentToday,
          startBalance,
          endBalance, // this is the "Net Money I have on that day"
        });
      }
    }

    return Array.from(sectionsByKey.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [expenses, incomeByDay]);

  // --- Income groups with running daily balance (same semantics as Expense groups)
  const incomeGroups = useMemo(() => {
    // Bucket incomes by day
    const buckets = new Map(); // dayKey -> income rows
    for (const i of incomes) {
      const k = ymdKeyFromISO(i.created_at);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(i);
    }
    for (const arr of buckets.values()) {
      arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Build expense sums per day (for daily "Spent" and balances)
    const expenseDay = new Map();
    for (const e of expenses) {
      const k = ymdKeyFromISO(e.created_at);
      const amt = parseFloat(String(e.amount || 0));
      expenseDay.set(k, (expenseDay.get(k) || 0) + (Number.isFinite(amt) ? amt : 0));
    }

    // We need cumulative sums across all days that have income or expense
    const allKeys = new Set([...buckets.keys(), ...expenseDay.keys(), ...incomeByDay.keys()]);
    const keysAsc = Array.from(allKeys).sort(); // "YYYY-MM-DD"

    let cumIncome = 0;
    let cumExpenses = 0;
    const sectionsByKey = new Map();

    for (const k of keysAsc) {
      const incToday = incomeByDay.get(k) || 0;
      cumIncome += incToday;

      const spentToday = expenseDay.get(k) || 0;

      // Balance available for the day BEFORE spending today (includes today's income)
      const startBalance = cumIncome - cumExpenses;
      // End-of-day balance after spending
      const endBalance = startBalance - spentToday;

      // Advance expense accumulator AFTER computing endBalance
      cumExpenses += spentToday;

      if (buckets.has(k)) {
        sectionsByKey.set(k, {
          key: k,
          label: formatDayLabelFromKey(k),
          items: buckets.get(k),
          incomeToday: incToday,
          spentToday,
          startBalance,
          endBalance, // Net you care about for the day
        });
      }
    }

    // Newest day first for rendering
    return Array.from(sectionsByKey.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [incomes, expenses, incomeByDay]);



  // Fetch spouse connection
  const fetchSpouseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("spouse_connections")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error; // not found is ok
      setSpouseConnection(data);
    } catch (err) {
      console.error("Error fetching spouse connection:", err);
    }
  };

  useEffect(() => {
    fetchSpouseConnection();
  }, [user.id]);

  // Fetch expenses for month (+spouse)
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoadingExpenses(true);
      setErrorExpenses(null);
      try {
        const start = firstDayOfMonth(viewMonth);
        const end = addMonths(start, 1);

        const { data: userExpenses, error: userError } = await supabase
          .from("expenses")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", toISODate(start))
          .lt("created_at", toISODate(end))
          .order("created_at", { ascending: false });

        if (userError) throw userError;

        let allExpenses = userExpenses || [];

        if (spouseConnection?.spouse_user_id) {
          const { data: spouseExpenses, error: spouseError } = await supabase
            .from("expenses")
            .select("*")
            .eq("user_id", spouseConnection.spouse_user_id)
            .gte("created_at", toISODate(start))
            .lt("created_at", toISODate(end))
            .order("created_at", { ascending: false });
          if (spouseError) throw spouseError;
          const marked = (spouseExpenses || []).map((row) => ({
            ...row,
            is_spouse: true,
            spouse_email: spouseConnection.spouse_email,
          }));
          allExpenses = [...allExpenses, ...marked].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
        }

        setExpenses(allExpenses);
      } catch (err) {
        setErrorExpenses(err.message || "Failed to load expenses.");
      } finally {
        setLoadingExpenses(false);
      }
    };
    fetchExpenses();
  }, [viewMonth, user.id, spouseConnection]);

  // Fetch income for month (+spouse)
  useEffect(() => {
    const fetchIncome = async () => {
      setLoadingIncome(true);
      setErrorIncome(null);
      try {
        const start = firstDayOfMonth(viewMonth);
        const end = addMonths(start, 1);

        const { data: userIncome, error: userError } = await supabase
          .from("incomes")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", toISODate(start))
          .lt("created_at", toISODate(end))
          .order("created_at", { ascending: false });
        if (userError) throw userError;

        let allIncome = userIncome || [];

        if (spouseConnection?.spouse_user_id) {
          const { data: spouseIncome, error: spouseError } = await supabase
            .from("incomes")
            .select("*")
            .eq("user_id", spouseConnection.spouse_user_id)
            .gte("created_at", toISODate(start))
            .lt("created_at", toISODate(end))
            .order("created_at", { ascending: false });
          if (spouseError) throw spouseError;
          const marked = (spouseIncome || []).map((row) => ({
            ...row,
            is_spouse: true,
            spouse_email: spouseConnection.spouse_email,
          }));
          allIncome = [...allIncome, ...marked].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
        }

        setIncomes(allIncome);
      } catch (err) {
        setErrorIncome(err.message || "Failed to load income.");
      } finally {
        setLoadingIncome(false);
      }
    };
    fetchIncome();
  }, [viewMonth, user.id, spouseConnection]);

  // Handlers: expenses
  const handleExpenseAdded = (newRow) => {
    const rowDate = new Date(newRow.created_at);
    const inMonth = rowDate >= firstDayOfMonth(viewMonth) && rowDate < addMonths(viewMonth, 1);
    if (inMonth) {
      setExpenses((old) => [newRow, ...old].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
    setIsExpenseFormOpen(false);
  };
  const handleExpenseUpdated = (updated) => {
    const rowDate = new Date(updated.created_at);
    const inMonth = rowDate >= firstDayOfMonth(viewMonth) && rowDate < addMonths(viewMonth, 1);
    setExpenses((old) => {
      const without = old.filter((e) => e.id !== updated.id);
      return inMonth ? [updated, ...without].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : without;
    });
    setEditingExpense(null);
  };
  const handleDeleteExpense = async (id) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      alert(error.message || "Failed to delete expense.");
      return;
    }
    setExpenses((old) => old.filter((e) => e.id !== id));
  };

  // Handlers: income
  const handleIncomeAdded = (newRow) => {
    const rowDate = new Date(newRow.created_at);
    const inMonth = rowDate >= firstDayOfMonth(viewMonth) && rowDate < addMonths(viewMonth, 1);
    if (inMonth) {
      setIncomes((old) => [newRow, ...old].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
    setIsIncomeFormOpen(false);
  };
  const handleIncomeUpdated = (updated) => {
    const rowDate = new Date(updated.created_at);
    const inMonth = rowDate >= firstDayOfMonth(viewMonth) && rowDate < addMonths(viewMonth, 1);
    setIncomes((old) => {
      const without = old.filter((e) => e.id !== updated.id);
      return inMonth ? [updated, ...without].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : without;
    });
    setEditingIncome(null);
  };
  const handleDeleteIncome = async (id) => {
    if (!confirm("Delete this income?")) return;
    const { error } = await supabase.from("incomes").delete().eq("id", id);
    if (error) {
      alert(error.message || "Failed to delete income.");
      return;
    }
    setIncomes((old) => old.filter((e) => e.id !== id));
  };

  const isCombined = Boolean(spouseConnection?.spouse_user_id);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* --- Header --- */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Money Tracker</h1>
            <div className="text-sm text-gray-500">
              <div>Welcome back, {user.email}!</div>
              {spouseConnection && (
                <div className="mt-1 text-red-500">💕 Connected to {spouseConnection.spouse_email}</div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <MonthNavigator
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              nextMonthDisabled={nextMonthDisabled}
              monthLabel={monthLabel}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSpouseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Heart className="size-5" />
                <span className="hidden sm:inline">Spouse</span>
              </button>
              {activeTab === "expenses" ? (
                <button
                  onClick={() => setIsExpenseFormOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusCircle className="size-5" />
                  <span className="hidden sm:inline">Add Expense</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsIncomeFormOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <PlusCircle className="size-5" />
                  <span className="hidden sm:inline">Add Income</span>
                </button>
              )}
              <button onClick={onSignOut} className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors" title="Sign Out">
                <LogOut className="size-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-4 inline-flex rounded-xl bg-white p-1 shadow-sm">
          <TabButton label="Expenses" active={activeTab === "expenses"} onClick={() => setActiveTab("expenses")} />
          <TabButton label="Income" active={activeTab === "income"} onClick={() => setActiveTab("income")} />
        </div>

        {/* --- Summary --- */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-2xl shadow-sm">
            <div className="text-sm text-gray-500">{isCombined ? "Combined" : "Your"} expenses — {monthLabel}</div>
            <div className="text-2xl font-bold text-gray-900">{phpCurrency(totalExpenses)}</div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsNetHidden((v) => !v)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIsNetHidden((v) => !v)}
            className="p-4 bg-white rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            title={isNetHidden ? "Click to show" : "Click to hide"}
            aria-label={isNetHidden ? "Net amount hidden. Click to show." : "Net amount shown. Click to hide."}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Net (income − expenses)</div>
                <div
                  className={`text-2xl font-bold transition-all duration-200 ${
                    net >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {isNetHidden
                    ? maskCurrencyString(phpCurrency(net), { dropDecimals: true, maskChar: "*" })
                    // If you prefer no decimals when hidden, set dropDecimals: true
                    : phpCurrency(net)}
                </div>
                <div className="text-xs text-gray-400 mt-1">{isNetHidden ? "Hidden" : "Shown"} — click to toggle</div>
              </div>
              <div className="mt-1">
                {isNetHidden ? <EyeOff className="size-5 text-gray-500" /> : <Eye className="size-5 text-gray-500" />}
              </div>
            </div>
          </div>

        </div>

        {/* --- Main Content --- */}
        <main>
          {activeTab === "expenses" ? (
            <ExpenseList
              groups={expenseGroups}
              loading={loadingExpenses}
              error={errorExpenses}
              monthLabel={monthLabel}
              currentUserId={user.id}
              onEdit={setEditingExpense}
              onDelete={handleDeleteExpense}
              isNetHidden={isNetHidden}
            />
          ) : (
            <IncomeList
              groups={incomeGroups}
              loading={loadingIncome}
              error={errorIncome}
              monthLabel={monthLabel}
              currentUserId={user.id}
              onEdit={setEditingIncome}
              onDelete={handleDeleteIncome}
              isNetHidden={isNetHidden}
            />
          )}

        </main>

        {/* Modals */}
        <ExpenseFormModal isOpen={isExpenseFormOpen} onClose={() => setIsExpenseFormOpen(false)} onAdd={handleExpenseAdded} />
        <IncomeFormModal
          isOpen={isIncomeFormOpen}
          onClose={() => setIsIncomeFormOpen(false)}
          onAdd={handleIncomeAdded}
          userId={user.id}
        />

        <SpouseModal
          isOpen={isSpouseModalOpen}
          onClose={() => setIsSpouseModalOpen(false)}
          user={user}
          spouseConnection={spouseConnection}
          onSpouseUpdate={fetchSpouseConnection}
        />

        {editingExpense && (
          <EditExpenseModal isOpen={true} expense={editingExpense} onClose={() => setEditingExpense(null)} onSave={handleExpenseUpdated} />
        )}
        {editingIncome && (
          <EditIncomeModal isOpen={true} income={editingIncome} onClose={() => setEditingIncome(null)} onSave={handleIncomeUpdated} />
        )}

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-gray-400">Built with React + Supabase</footer>
      </div>
    </div>
  );
}