import { supabase } from "../lib/supabase";
import logo from "../../public/kanban-logo.png";

function Login() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-6 flex flex-col items-center">

          {/* Brand Section */}
          <div className="flex flex-col items-center mb-10">
            <img
                src={logo}
                alt="KanDoo logo"
                className="w-44 h-auto mb-6"
            />

            <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
              KanDoo
            </h1>

            <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
              A calm place to organize your work
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white shadow-xl rounded-2xl p-6 w-full">
            <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
                />
                <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.6 4.8C14.7 16.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
                />
                <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.3C29.2 35.8 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.4 44 24 44z"
                />
                <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-1.1 2.8-3.1 5-5.6 6.4l6.3 5.3C39.7 36.2 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z"
                />
              </svg>
              Sign in with Google
            </button>

            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              We use Google only for authentication.
              <br />
              No spam. No nonsense.
            </p>
          </div>
        </div>
      </div>
  );
}

export default Login;