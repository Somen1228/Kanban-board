import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabase";

function BoardMembersModal({ boardId, onClose }) {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");

  useEffect(() => {
    fetchMembers();
  }, []);

  /* ---------------- Fetch Members ---------------- */

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("board_members")
      .select(`
        id,
        role,
        user_id,
        user:auth.users(email)
      `)
      .eq("board_id", boardId);

    setMembers(data || []);
  };

  /* ---------------- Invite ---------------- */

  const inviteUser = async () => {
    if (!email) return;

    await supabase.from("board_invitations").insert({
      board_id: boardId,
      email,
      role,
    });

    setEmail("");
  };

  /* ---------------- Role Update ---------------- */

  const updateRole = async (memberId, newRole) => {
    await supabase
      .from("board_members")
      .update({ role: newRole })
      .eq("id", memberId);

    fetchMembers();
  };

  /* ---------------- Remove Member ---------------- */

  const removeMember = async (memberId) => {
    await supabase
      .from("board_members")
      .delete()
      .eq("id", memberId);

    fetchMembers();
  };

  /* ---------------- UX Improvements ---------------- */

  // Close on ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

      {/* Dim + Blur Background */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-[440px] max-w-[92%] rounded-2xl p-6 shadow-2xl animate-[scaleIn_0.15s_ease-out]">

        <h2 className="text-lg font-semibold mb-4">
          Board Members
        </h2>

        {/* Members List */}
        <div className="space-y-3 mb-5 max-h-[240px] overflow-y-auto pr-1">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
            >
              <span className="text-sm">{m.user?.email}</span>

              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) =>
                    updateRole(m.id, e.target.value)
                  }
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="owner">Owner</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>

                <button
                  onClick={() => removeMember(m.id)}
                  className="text-red-500 text-xs hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Invite Section */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <input
              placeholder="Invite by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border rounded-lg px-2 py-2 text-sm"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>

            <button
              onClick={inviteUser}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
            >
              Invite
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default BoardMembersModal;