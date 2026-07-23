import { useState } from "react";
import { Sun, Moon, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import Avatar from "./Avatar";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function TopBar({
  onSelectProfile,
  onSelectUser,
  onSelectChannelMessage,
  onSelectDmMessage,
}) {
  const { profile, signOut } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  async function handleLogoutConfirm() {
    setConfirmingLogout(false);
    try {
      await signOut();
      showToast("Signed out", "success");
    } catch (err) {
      console.error("Sign out failed:", err);
      showToast("Couldn't sign out", "error");
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
      <SearchBar
        onSelectUser={onSelectUser}
        onSelectChannelMessage={onSelectChannelMessage}
        onSelectDmMessage={onSelectDmMessage}
      />

      <div className="flex items-center gap-1 ml-auto">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Toggle theme">
          {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-gray-500" />}
        </button>

        <NotificationBell onOpenThread={onSelectDmMessage} />

        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Avatar 
              name={profile?.full_name} 
              color={profile?.avatar_color} 
              size={7} 
              status="online"
              imageUrl={profile?.avatar_url}
            />
            <span className="text-sm font-medium hidden sm:block text-gray-900 dark:text-gray-100">
              {profile?.full_name}
            </span>
            <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    onSelectProfile();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <UserIcon size={15} /> My Profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmingLogout(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmingLogout}
        title="Log out?"
        message="You'll need to sign in again to keep chatting."
        confirmLabel="Log Out"
        danger
        onConfirm={handleLogoutConfirm}
        onCancel={() => setConfirmingLogout(false)}
      />
    </div>
  );
}