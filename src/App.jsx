import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Board from "./pages/Board";
import Login from "./pages/Login"

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get existing session on refresh
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Listen for login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!session) {
    return <Login />;
  }

  return (
    <div className="App">
        <Board />
    </div>
  );
}

export default App;