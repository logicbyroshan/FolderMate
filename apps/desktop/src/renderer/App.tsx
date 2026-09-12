import React, { useState, useEffect } from "react";
import { Sidebar, NavView } from "./components/Sidebar.js";
import { TopBar } from "./components/TopBar.js";
import { Dashboard } from "./views/Dashboard.js";
import { Search } from "./views/Search.js";
import { ReviewQueue } from "./views/ReviewQueue.js";
import { Clients } from "./views/Clients.js";
import { Rules } from "./views/Rules.js";
import { Settings } from "./views/Settings.js";
import { ToastProvider } from "./components/ui/Toast.js";
import { CommandPalette } from "./components/ui/CommandPalette.js";

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>("dashboard");
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [engineConnected, setEngineConnected] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const fetchGlobalStats = async () => {
    try {
      if ((window as any).foldermate) {
        const queueRes = await (window as any).foldermate.call("reviewQueue.list");
        setPendingReviewCount(queueRes?.length || 0);
        setEngineConnected(true);
      }
    } catch {
      setEngineConnected(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 4000);

    // Global keyboard shortcuts (Ctrl+K for Command Palette, / for search)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Subscribe to IPC server events
    if ((window as any).foldermate?.onEvent) {
      const unsubscribe = (window as any).foldermate.onEvent((event: any) => {
        if (event.eventType === "REVIEW_REQUIRED" || event.eventType === "FILE_ORGANIZED") {
          fetchGlobalStats();
        }
      });
      return () => {
        clearInterval(interval);
        window.removeEventListener("keydown", handleKeyDown);
        unsubscribe();
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleScanNow = async () => {
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.call("system.triggerScan");
        fetchGlobalStats();
      }
    } catch (err) {
      console.error("Scan error:", err);
    }
  };

  const handleOpenInbox = async () => {
    try {
      if ((window as any).foldermate) {
        const st = await (window as any).foldermate.call("system.getStatus");
        if (st?.inboxPath) {
          await (window as any).foldermate.openPath(st.inboxPath);
        }
      }
    } catch {}
  };

  const handleOpenStorage = async () => {
    try {
      if ((window as any).foldermate) {
        const st = await (window as any).foldermate.call("system.getStatus");
        if (st?.organizationRoot) {
          await (window as any).foldermate.openPath(st.organizationRoot);
        }
      }
    } catch {}
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-canvas)" }}>
      {/* Fixed Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        pendingReviewCount={pendingReviewCount}
        engineConnected={engineConnected}
      />

      {/* Main Workspace Area */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100vh", overflow: "hidden" }}>
        <TopBar
          onSearchFocus={() => setCurrentView("search")}
          onScanNow={handleScanNow}
          onOpenInbox={handleOpenInbox}
          onOpenStorage={handleOpenStorage}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            backgroundColor: "var(--bg-canvas)",
          }}
        >
          {currentView === "dashboard" && <Dashboard onNavigate={setCurrentView} />}
          {currentView === "search" && <Search />}
          {currentView === "review" && <ReviewQueue />}
          {currentView === "clients" && <Clients />}
          {currentView === "rules" && <Rules />}
          {currentView === "settings" && <Settings />}
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view) => setCurrentView(view as NavView)}
        onTriggerScan={handleScanNow}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};
