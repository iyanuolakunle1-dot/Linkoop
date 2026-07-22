import { Hash, MessageSquare, User as UserIcon } from "lucide-react";

export default function MobileBottomNav({ activeView, onSelectGeneral, onSelectDM, onSelectProfile }) {
  return (
    <div className="lg:hidden flex items-center justify-around border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2 flex-shrink-0">
      <button onClick={onSelectGeneral} className="flex flex-col items-center gap-0.5 px-4 py-1">
        <Hash size={20} className={activeView === "general" ? "text-indigo-500" : "text-gray-400"} />
      </button>
      <button onClick={onSelectDM} className="flex flex-col items-center gap-0.5 px-4 py-1">
        <MessageSquare size={20} className={activeView === "dm" ? "text-indigo-500" : "text-gray-400"} />
      </button>
      <button onClick={onSelectProfile} className="flex flex-col items-center gap-0.5 px-4 py-1">
        <UserIcon size={20} className={activeView === "profile" ? "text-indigo-500" : "text-gray-400"} />
      </button>
    </div>
  );
}