import React, { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import AuthComponent from "./components/Auth";
import MoneyApp from "./features/money/MoneyApp";

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  return <MoneyApp user={user} onSignOut={handleSignOut} />;
}