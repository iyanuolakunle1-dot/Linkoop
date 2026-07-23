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
    api.get("/api/profiles").then(setAllUsers).catch(() => {});
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
    const { threadId } = await api.post(`/api/dm/threads/${userId}`, {});
    selectDM(threadId, userId);
  }

  return (
    <div className="w-full min-h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        activeView={activeView}
        onSelectGeneral={selectGeneral}
        onSelectDM={selectDM}
        onSelectProfile={selectProfile}
        selectedDMUserId={selectedUserId}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar
          onSelectProfile={selectProfile}
          onSelectUser={handleSelectUserFromSearch}
          onSelectChannelMessage={selectGeneral}
          onSelectDmMessage={selectDM}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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

        <MobileBottomNav
          activeView={activeView}
          onSelectGeneral={selectGeneral}
          onSelectDM={goToDMList}
          onSelectProfile={selectProfile}
        />
      </div>
    </div>
  );
}