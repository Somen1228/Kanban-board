import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
// import { VscGithubInverted } from "react-icons/vsc";
// import favicon from "../../public/favicon.png";

function Navbar({ setSearchTerm, user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const avatarUrl =
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture;

  const userName = user?.user_metadata?.full_name || "User";

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
        document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="flex items-center justify-between px-10 h-16">
          {/* Left: Brand */}
          <a
              href="https://github.com/Somen1228/Kanban-board"
              target="_blank"
              title="GitHub"
              className="relative -ml-9 h-12 w-12 flex items-center justify-center -ml-2 group"
          >
            {/* Normal face */}
            <img
                src="/favicon.png"
                alt="KanDoo logo"
                className="absolute h-12 w-12 transition-opacity duration-200 group-hover:opacity-0"
            />

            {/* Smiling face */}
            <img
                src="/favicon-smiling2.png"
                alt="KanDoo smiling logo"
                className="absolute h-11 w-11 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
          </a>

          {/* Center: Search */}
          <div className="flex items-center w-[22rem] bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-gray-300 transition">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
                className="ml-3 w-full bg-transparent outline-none text-sm placeholder-gray-500"
                placeholder="Search tasks…"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={menuRef}>
              <button
                  onClick={() => setMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition"
              >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="profile"
                        className="h-8 w-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                      👤
                    </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {userName}
              </span>
              </button>

              {menuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                      Export data
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                      Import data
                    </button>
                    <div className="h-px bg-gray-200 my-1" />
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      </nav>
  );
}

export default Navbar;