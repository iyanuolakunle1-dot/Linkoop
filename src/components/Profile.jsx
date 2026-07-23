import { useState, useRef } from "react";
import { Edit3, Camera, X, Upload } from "lucide-react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useToast } from "../context/ToastContext";

export default function Profile() {
  const { profile, setProfile } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [role, setRole] = useState(profile?.role || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  if (!profile) return null;

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.patch("/profiles/me", { 
        bio, 
        role, 
        full_name: fullName,
        username 
      });
      setProfile(updated);
      setEditing(false);
      showToast("Profile updated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(await import("../lib/supabaseClient")).supabase.auth.getSession().then(data => data.data.session?.access_token)}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      
      const data = await response.json();
      
      // Update profile with new avatar URL
      const updated = await api.patch("/profiles/me", { 
        avatar_url: data.url 
      });
      setProfile(updated);
      showToast("Avatar updated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload avatar", "error");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="h-28 sm:h-36 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 relative">
          {/* Cover photo placeholder - can be enhanced later */}
        </div>
        
        <div className="bg-white dark:bg-gray-900 px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between">
            <div className="relative group">
              <div className="ring-4 ring-white dark:ring-gray-900 rounded-full">
                <Avatar 
                  name={profile.full_name} 
                  color={profile.avatar_color} 
                  size={22} 
                  status="online"
                  imageUrl={profile.avatar_url}
                />
              </div>
              
              {/* Avatar upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-colors disabled:opacity-50"
                title="Change avatar"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            
            <button
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium border rounded-full px-3 py-1.5 mb-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Edit3 size={14} /> {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
          
          {!editing ? (
            <>
              <div className="mt-3 text-lg font-bold text-gray-900 dark:text-gray-100">
                {profile.full_name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                @{profile.username} · Online
              </div>
              {profile.role && (
                <div className="mt-2 inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  {profile.role}
                </div>
              )}
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {profile.bio || "No bio yet. Tell people about yourself!"}
              </p>
              
              {/* Additional stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-6">
                <div>
                  <div className="text-xs text-gray-400">Member since</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Status</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {profile.status}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
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
                  rows={3}
                  placeholder="Tell people about yourself"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
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