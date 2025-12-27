import { supabase } from "../lib/supabase";

function Login() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <button onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  );
}

export default Login;