import { useState } from "react";
import { Edit3 } from "lucide-react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Profile() {
  const { profile, setProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [role, setRole] = useState(profile?.role || "");
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.patch("/profiles/me", { bio, role });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="h-28 sm:h-36 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600" />
        <div className="bg-white dark:bg-gray-900 px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between">
            <div className="ring-4 ring-white dark:ring-gray-900 rounded-full">
              <Avatar name={profile.full_name} color={profile.avatar_color} size={22} status="online" />
            </div>
            <button
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium border rounded-full px-3 py-1.5 mb-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200"
            >
              <Edit3 size={14} /> {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
          <div className="mt-3 text-lg font-bold text-gray-900 dark:text-gray-100">{profile.full_name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">@{profile.username} · Online</div>

          {!editing ? (
            <>
              {profile.role && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{profile.role}</p>}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {profile.bio || "No bio yet."}
              </p>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Product Designer"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Tell people about yourself"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}