import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import GeneralChat from "../components/GeneralChat";
import DirectMessage from "../components/DirectMessage";
import DMList from "../components/DMList";
import RightPanel from "../components/RightPanel";
import Profile from "../components/Profile";
import MobileBottomNav from "../components/MobileBottomNav";

export default function Chat() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("general"); // general | dm | profile
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    api.get("/profiles").then(setAllUsers).catch(() => {});
  }, []);

  function selectGeneral() {
    setActiveView("general");
    setMobileSidebarOpen(false);
  }

  function selectDM(threadId, userId) {
    setSelectedThreadId(threadId);
    setSelectedUserId(userId);
    setActiveView("dm");
    setMobileSidebarOpen(false);
  }

  function selectProfile() {
    setActiveView("profile");
    setMobileSidebarOpen(false);
  }

  function goToDMList() {
    setSelectedThreadId(null);
    setSelectedUserId(null);
    setActiveView("dm");
    setMobileSidebarOpen(false);
  }

  async function handleSelectUserFromSearch(userId) {
    const { threadId } = await api.post(`/dm/threads/${userId}`, {});
    selectDM(threadId, userId);
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        activeView={activeView}
        onSelectGeneral={selectGeneral}
        onSelectDM={selectDM}
        onSelectProfile={selectProfile}
        selectedDMUserId={selectedUserId}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* min-h-0 lets the flex-1 child below actually scroll within its own box */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <TopBar
          onSelectProfile={selectProfile}
          onSelectUser={handleSelectUserFromSearch}
          onSelectChannelMessage={selectGeneral}
          onSelectDmMessage={selectDM}
        />

        {activeView === "general" && (
          <GeneralChat
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onToggleRightPanel={() => setMobileRightPanelOpen((v) => !v)}
          />
        )}

        {activeView === "dm" && !selectedThreadId && (
          <DMList
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onSelectThread={selectDM}
            allUsers={allUsers}
            currentUserId={user?.id}
          />
        )}

        {activeView === "dm" && selectedThreadId && (
          <DirectMessage
            threadId={selectedThreadId}
            otherUserId={selectedUserId}
            onBack={goToDMList}
            onToggleRightPanel={() => setMobileRightPanelOpen((v) => !v)}
          />
        )}

        {activeView === "profile" && <Profile />}

        <MobileBottomNav
          activeView={activeView}
          onSelectGeneral={selectGeneral}
          onSelectDM={goToDMList}
          onSelectProfile={selectProfile}
        />
      </div>

      {activeView !== "profile" && (
        <RightPanel
          mode={activeView === "dm" ? "dm" : "general"}
          otherUserId={selectedUserId}
          mobileOpen={mobileRightPanelOpen}
          onClose={() => setMobileRightPanelOpen(false)}
        />
      )}
    </div>
  );
}