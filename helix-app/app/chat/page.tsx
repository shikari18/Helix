'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import Sidebar from '../components/Sidebar';
import TopControls from '../components/TopControls';
import SettingsOverlay from '../components/SettingsOverlay';
import VoiceSphereOverlay from '../components/VoiceSphereOverlay';
import SearchOverlay from '../components/SearchOverlay';
import ShareModal from '../components/ShareModal';
import PageSplash from '../components/PageSplash';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatList, setChatList] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate page load
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleNewChat = () => {
    setIsIncognito(false);
  };

  const handleToggleGhost = () => {
    setIsIncognito(!isIncognito);
  };

  return (
    <>
      {loading && <PageSplash />}
      
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        chatList={chatList}
        setChatList={setChatList}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={(id) => {
          setCurrentChatId(id);
          setSidebarOpen(false);
        }}
        onLogout={() => console.log('Logout')}
        onShareChat={() => setShareModalOpen(true)}
      />

      <TopControls 
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onToggleGhost={handleToggleGhost}
        isGhostMode={isIncognito}
        chatActive={chatList.length > 0}
      />

      <ChatInterface 
        isIncognito={isIncognito}
        voiceModeActive={voiceModeActive}
        onToggleVoiceMode={() => setVoiceModeActive(!voiceModeActive)}
        onOpenShare={() => setShareModalOpen(true)}
        onNewChat={handleNewChat}
      />

      <SettingsOverlay 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <SearchOverlay 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <VoiceSphereOverlay 
        isActive={voiceModeActive}
        onClose={() => setVoiceModeActive(false)}
      />

      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </>
  );
}
