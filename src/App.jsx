import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  CalendarDays,
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
} from "lucide-react";

// --- Supabase client (put your keys in .env as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helpers & Constants ---
const ACCOUNTS = ["gcash", "debit card", "cash", "credit card"];
const CATEGORIES = [
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

// A map for category icons for better visual distinction
const categoryIcons = {
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

// --- Helper Functions (no changes here) ---
function firstDayOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function toISODate(d) { return d.toISOString(); }
function toLocalDatetimeInputValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear(); const m = pad(date.getMonth() + 1); const d = pad(date.getDate());
  const hh = pad(date.getHours()); const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}
function phpCurrency(n) {
  return Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "PHP" });
}

// --- Auth Component ---
function AuthComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      if (isSignUp) {
        alert("Check your email for verification link!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? "Sign Up" : "Sign In"} to Expense Tracker
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:underline font-medium"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
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
      const { error } = await supabase
        .from("spouse_connections")
        .delete()
        .eq("user_id", user.id);
      
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
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Spouse Email Address
              </label>
              <input
                type="email"
                value={spouseEmail}
                onChange={(e) => setSpouseEmail(e.target.value)}
                placeholder="spouse@email.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your expenses will be combined automatically. No confirmation needed.
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

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

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthComponent />;
  }

  return <ExpenseApp user={user} onSignOut={handleSignOut} />;
}

// --- Expense App Component ---
function ExpenseApp({ user, onSignOut }) {
  const [viewMonth, setViewMonth] = useState(firstDayOfMonth(new Date()));
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSpouseModalOpen, setIsSpouseModalOpen] = useState(false);
  const [spouseConnection, setSpouseConnection] = useState(null);
  const [editing, setEditing] = useState(null);

  const nextMonthDisabled = useMemo(() => addMonths(viewMonth, 1) > firstDayOfMonth(new Date()), [viewMonth]);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(viewMonth), [viewMonth]);
  const total = useMemo(() => expenses.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0), [expenses]);

  // Fetch spouse connection
  const fetchSpouseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("spouse_connections")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setSpouseConnection(data);
    } catch (err) {
      console.error("Error fetching spouse connection:", err);
    }
  };

  useEffect(() => {
    fetchSpouseConnection();
  }, [user.id]);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = firstDayOfMonth(viewMonth);
        const end = addMonths(start, 1);
        
        // Fetch user's own expenses
        const { data: userExpenses, error: userError } = await supabase
          .from("expenses")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", toISODate(start))
          .lt("created_at", toISODate(end))
          .order("created_at", { ascending: false });
        
        if (userError) throw userError;
        
        let allExpenses = userExpenses || [];
        
        // If spouse is connected, fetch their expenses too
        if (spouseConnection?.spouse_user_id) {
          const { data: spouseExpenses, error: spouseError } = await supabase
            .from("expenses")
            .select("*")
            .eq("user_id", spouseConnection.spouse_user_id)
            .gte("created_at", toISODate(start))
            .lt("created_at", toISODate(end))
            .order("created_at", { ascending: false });
          
          if (spouseError) throw spouseError;
          
          // Mark spouse expenses and combine
          const markedSpouseExpenses = (spouseExpenses || []).map(expense => ({
            ...expense,
            is_spouse_expense: true,
            spouse_email: spouseConnection.spouse_email
          }));
          
          allExpenses = [...allExpenses, ...markedSpouseExpenses]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        
        setExpenses(allExpenses);
      } catch (err) {
        setError(err.message || "Failed to load expenses.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpenses();
  }, [viewMonth, user.id, spouseConnection]);

  const handleAddExpense = (newExpense) => {
    const rowDate = new Date(newExpense.created_at);
    const inMonth = rowDate >= firstDayOfMonth(viewMonth) && rowDate < addMonths(viewMonth, 1);
    if (inMonth) {
      setExpenses((old) => [newExpense, ...old].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
    }
    setIsFormOpen(false);
  };

  const handleEditOpen = (expense) => setEditing(expense);
  const handleEditClose = () => setEditing(null);

  const handleExpenseUpdated = (updated) => {
    // If date moved out of the visible month, remove it; else replace it.
    const rowDate = new Date(updated.created_at);
    const inMonth = rowDate >= firstDayOfMonth(viewMonth) && rowDate < addMonths(viewMonth, 1);
    setExpenses((old) => {
      const without = old.filter(e => e.id !== updated.id);
      return inMonth
        ? [updated, ...without].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
        : without;
    });
    setEditing(null);
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      alert(error.message || "Failed to delete expense.");
      return;
    }
    setExpenses((old) => old.filter(e => e.id !== id));
  };

  const handleSpouseUpdate = () => {
    fetchSpouseConnection();
  };

  const isCombined = Boolean(spouseConnection?.spouse_user_id);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* --- Header --- */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
            <div className="text-sm text-gray-500">
              <div>Welcome back, {user.email}!</div>
              {spouseConnection && (
                <div className="mt-1 text-red-500">
                  💕 Connected to {spouseConnection.spouse_email}
                </div>
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
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusCircle className="size-5" />
                <span className="hidden sm:inline">Add Expense</span>
              </button>
              <button
                onClick={onSignOut}
                className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors"
                title="Sign Out"
              >
                <LogOut className="size-5" />
              </button>
            </div>
          </div>
        </header>

        {/* --- Main Content --- */}
        <main>
          <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {Boolean(spouseConnection?.spouse_user_id) ? "Combined total" : "Total"} for {monthLabel}
            </div>
            <div className="text-2xl font-bold text-gray-900">{phpCurrency(total)}</div>
          </div>

          {/* Keep only ONE list */}
          <ExpenseList
            expenses={expenses}
            loading={loading}
            monthLabel={monthLabel}
            userEmail={user.email}
            currentUserId={user.id}
            onEdit={handleEditOpen}
            onDelete={handleDeleteExpense}
          />
        </main>

        <ExpenseFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onAddExpense={handleAddExpense}
        />

        <SpouseModal
          isOpen={isSpouseModalOpen}
          onClose={() => setIsSpouseModalOpen(false)}
          user={user}
          spouseConnection={spouseConnection}
          onSpouseUpdate={handleSpouseUpdate}
        />

        {/* Single footer */}
        <footer className="py-8 text-center text-xs text-gray-400">
          Built with React + Supabase
        </footer>

        {editing && (
          <EditExpenseModal
            isOpen={true}
            expense={editing}
            onClose={handleEditClose}
            onSave={handleExpenseUpdated}
          />
        )}
      </div>
    </div>
  );

}

// --- Sub-components for better organization ---

function MonthNavigator({ viewMonth, setViewMonth, nextMonthDisabled, monthLabel }) {
  const gotoPrevMonth = () => setViewMonth((m) => addMonths(m, -1));
  const gotoNextMonth = () => !nextMonthDisabled && setViewMonth((m) => addMonths(m, 1));
  const gotoCurrentMonth = () => setViewMonth(firstDayOfMonth(new Date()));
  
  return (
    <div className="flex items-center gap-2">
      <button onClick={gotoPrevMonth} className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors"><ChevronLeft className="size-5" /></button>
      <button onClick={gotoCurrentMonth} className="px-3 py-2 text-sm font-semibold rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors">{monthLabel}</button>
      <button onClick={gotoNextMonth} disabled={nextMonthDisabled} className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="size-5" /></button>
    </div>
  );
}

function ExpenseList({ expenses, loading, monthLabel, userEmail, currentUserId, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 bg-white rounded-2xl shadow-sm">
        <LoaderCircle className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
        <p>No expenses for {monthLabel} yet.</p>
        <p className="text-sm mt-1">Click "Add Expense" to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((e) => (
        <ExpenseListItem
          key={e.id}
          expense={e}
          userEmail={userEmail}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ExpenseListItem({ expense, userEmail, currentUserId, onEdit, onDelete }) {
  const { id, user_id, amount, account, category, note, created_at, is_spouse_expense, spouse_email } = expense;
  const date = new Date(created_at);
  const canManage = user_id === currentUserId;

  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 ${is_spouse_expense ? 'border-l-4 border-red-200' : ''}`}>
      <div className={`p-3 rounded-full ${is_spouse_expense ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
        {categoryIcons[category] || <MoreHorizontal className="size-5" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold capitalize text-gray-800">{note || category}</p>
          {is_spouse_expense && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {spouse_email}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • <span className="capitalize">{account}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-gray-900">{phpCurrency(parseFloat(String(amount)))}</p>
        <p className="text-xs text-gray-400">{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>

        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            className={`p-2 rounded-lg ${canManage ? 'bg-white hover:bg-gray-100' : 'bg-gray-50 opacity-60 cursor-not-allowed'} shadow-sm transition-colors`}
            title={canManage ? 'Edit' : "You can’t edit spouse expenses"}
            onClick={() => canManage && onEdit(expense)}
            disabled={!canManage}
          >
            {canManage ? <Pencil className="size-4" /> : <Lock className="size-4" />}
          </button>
          <button
            className={`p-2 rounded-lg ${canManage ? 'bg-white hover:bg-gray-100' : 'bg-gray-50 opacity-60 cursor-not-allowed'} shadow-sm transition-colors`}
            title={canManage ? 'Delete' : "You can’t delete spouse expenses"}
            onClick={() => canManage && onDelete(id)}
            disabled={!canManage}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExpenseFormModal({ isOpen, onClose, onAddExpense }) {
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("gcash");
  const [category, setCategory] = useState("food");
  const [dt, setDt] = useState(toLocalDatetimeInputValue());
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setAmount(""); setAccount("gcash"); setCategory("food");
      setDt(toLocalDatetimeInputValue()); setNote(""); setError(null);
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
      const payload = { amount: amt, account, category, note: note || null, created_at: new Date(dt).toISOString() };
      const { data, error } = await supabase.from("expenses").insert(payload).select();
      if (error) throw error;
      onAddExpense(data[0]);
    } catch (err) {
      setError(err.message || "Failed to add expense.");
    } finally {
      setSubmitting(false);
    }
  }
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="size-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form Fields */}
          <label className="block"><span className="text-sm font-medium text-gray-600">Amount</span>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block"><span className="text-sm font-medium text-gray-600">Account</span>
              <select value={account} onChange={(e) => setAccount(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                {ACCOUNTS.map((a) => <option key={a} value={a} className="capitalize">{a}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm font-medium text-gray-600">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </label>
          </div>
          <label className="block"><span className="text-sm font-medium text-gray-600">Date & Time</span>
            <input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" />
          </label>
          <label className="block"><span className="text-sm font-medium text-gray-600">Note (Optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., Lunch with team"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 min-h-[60px]" />
          </label>
          {/* --- Submission Area --- */}
          <div className="flex items-center justify-between pt-2">
            <button type="submit" disabled={submitting}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors">
              {submitting && <LoaderCircle className="size-4 animate-spin mr-2" />}
              {submitting ? "Adding..." : "Add Expense"}
            </button>
            {error && <div className="text-sm text-red-600 text-right">{error}</div>}
          </div>
        </form>
      </div>
    </div>
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
      const { data, error } = await supabase
        .from("expenses")
        .update(payload)
        .eq("id", expense.id)
        .select()
        .single();

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="size-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">Edit Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-600">Amount</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-600">Account</span>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a} value={a} className="capitalize">
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-600">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-600">Date & Time</span>
            <input
              type="datetime-local"
              value={dt}
              onChange={(e) => setDt(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-600">Note (Optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Lunch with team"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 min-h-[60px]"
            />
          </label>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
            >
              {submitting && <LoaderCircle className="size-4 animate-spin mr-2" />}
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            {error && <div className="text-sm text-red-600 text-right">{error}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}
