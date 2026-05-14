import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Board from "./pages/Board";
import Login from "./pages/Login";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authTransition, setAuthTransition] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuthTransition(false);
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading || authTransition) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
            </div>
        );
    }


  return session ? <Board user={session?.user}/> : <Login />;
}

export default App;