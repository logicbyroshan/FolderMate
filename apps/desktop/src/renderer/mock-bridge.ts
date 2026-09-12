/**
 * Browser Mock Bridge for FolderMate
 * Provides an interactive in-memory RPC mock when running in a standalone browser dev server.
 */

export function setupBrowserMockBridge() {
  if (typeof window === "undefined" || (window as any).foldermate) {
    return;
  }

  let clients = [
    {
      id: "client-1",
      name: "ABC School",
      code: "ABCSCH",
      aliases: ["ABC", "ABCS", "ABC SCHOOL", "ABC HIGH"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "client-2",
      name: "Apex Healthcare",
      code: "APEXHC",
      aliases: ["APEX", "APEX HOSPITAL", "APEX HEALTH"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "client-3",
      name: "Zenith Corp",
      code: "ZENITH",
      aliases: ["ZENITH CORP", "ZENITH TECH"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  let projects = [
    {
      id: "proj-1",
      clientId: "client-1",
      name: "Student ID Card",
      category: "ID Card",
      year: 2026,
    },
    {
      id: "proj-2",
      clientId: "client-1",
      name: "Annual Magazine",
      category: "Publication",
      year: 2026,
    },
    {
      id: "proj-3",
      clientId: "client-2",
      name: "Staff Identity Card",
      category: "ID Card",
      year: 2026,
    },
    {
      id: "proj-4",
      clientId: "client-3",
      name: "Corporate Lanyard",
      category: "Merchandise",
      year: 2025,
    },
  ];

  let files = [
    {
      id: "file-1",
      originalName: "abc school id card 2026 v8.cdr",
      currentPath: "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v8.cdr",
      extension: "cdr",
      fileSizeBytes: 24580000,
      version: 8,
      status: "ORGANIZED",
      classificationConfidence: 0.98,
      clientName: "ABC School",
      projectName: "Student ID Card",
      category: "ID Card",
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: "file-2",
      originalName: "apex staff id card 2026 v3.pdf",
      currentPath: "D:\\Clients\\Apex Healthcare\\2026\\ID Card\\Apex Healthcare Staff ID Card 2026 v3.pdf",
      extension: "pdf",
      fileSizeBytes: 4200000,
      version: 3,
      status: "ORGANIZED",
      classificationConfidence: 0.96,
      clientName: "Apex Healthcare",
      projectName: "Staff Identity Card",
      category: "ID Card",
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "file-3",
      originalName: "zenith lanyard design 2025 v1.cdr",
      currentPath: "D:\\Clients\\Zenith Corp\\2025\\Merchandise\\Zenith Corp Corporate Lanyard 2025 v1.cdr",
      extension: "cdr",
      fileSizeBytes: 18900000,
      version: 1,
      status: "ORGANIZED",
      classificationConfidence: 0.92,
      clientName: "Zenith Corp",
      projectName: "Corporate Lanyard",
      category: "Merchandise",
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: "file-4",
      originalName: "abc magazine final print 2026 v2.pdf",
      currentPath: "D:\\Clients\\ABC School\\2026\\Publication\\ABC School Annual Magazine 2026 v2.pdf",
      extension: "pdf",
      fileSizeBytes: 84100000,
      version: 2,
      status: "ORGANIZED",
      classificationConfidence: 0.95,
      clientName: "ABC School",
      projectName: "Annual Magazine",
      category: "Publication",
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
  ];

  let reviewQueue = [
    {
      id: "review-1",
      filePath: "C:\\FolderMate\\Inbox\\draft id final ok.cdr",
      originalName: "draft id final ok.cdr",
      reason: "Missing unambiguous client name in filename",
      suggestedClientId: "client-1",
      suggestedClientName: "ABC School",
      suggestedProjectName: "Student ID Card",
      suggestedCategory: "ID Card",
      suggestedYear: 2026,
      suggestedConfidence: 0.65,
      detectedMetadata: {
        extension: "cdr",
        sizeBytes: 15400000,
        detectedYear: 2026,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "review-2",
      filePath: "C:\\FolderMate\\Inbox\\hospital badge print.pdf",
      originalName: "hospital badge print.pdf",
      reason: "Low classification confidence score (0.72 < 0.85 threshold)",
      suggestedClientId: "client-2",
      suggestedClientName: "Apex Healthcare",
      suggestedProjectName: "Staff Identity Card",
      suggestedCategory: "ID Card",
      suggestedYear: 2026,
      suggestedConfidence: 0.72,
      detectedMetadata: {
        extension: "pdf",
        sizeBytes: 2100000,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
  ];

  let folderRules = [
    {
      id: "frule-1",
      name: "Active Clients",
      scope: "CLIENT",
      colorPreset: "Amber",
      customIconPath: null,
      customColorHex: "#f59e0b",
      priority: 100,
      isActive: true,
    },
    {
      id: "frule-2",
      name: "Design & ID Card Projects",
      scope: "PROJECT",
      colorPreset: "Blue",
      customIconPath: null,
      customColorHex: "#3b82f6",
      priority: 90,
      isActive: true,
    },
    {
      id: "frule-3",
      name: "Rush & High Priority Orders",
      scope: "PRIORITY",
      colorPreset: "Red",
      customIconPath: null,
      customColorHex: "#ef4444",
      priority: 110,
      isActive: true,
    },
    {
      id: "frule-4",
      name: "Completed Archive",
      scope: "STATUS",
      colorPreset: "Gray",
      customIconPath: null,
      customColorHex: "#64748b",
      priority: 50,
      isActive: true,
    },
  ];

  let settings = {
    ingestion: {
      inboxPath: "C:\\FolderMate\\Inbox",
      stabilizationMs: 1500,
    },
    storage: {
      organizationRoot: "D:\\Clients",
      archiveRoot: "D:\\Archive",
      safeMode: true,
      collisionPolicy: "AUTO_INCREMENT",
    },
    coreldraw: {
      enabled: true,
      timeoutMs: 10000,
    },
  };

  const listeners: Array<(event: any) => void> = [];

  (window as any).foldermate = {
    call: async (method: string, payload?: any) => {
      console.log(`[Browser Mock RPC] ${method}`, payload);

      switch (method) {
        case "system.getStatus":
          return {
            status: "RUNNING",
            isIdle: true,
            inboxPath: settings.ingestion.inboxPath,
            organizationRoot: settings.storage.organizationRoot,
            archiveRoot: settings.storage.archiveRoot,
            pendingReviewCount: reviewQueue.length,
            totalOrganized: files.length + 144,
            activeRulesCount: folderRules.filter((r) => r.isActive).length,
            memoryUsageMB: 31.4,
          };

        case "system.triggerScan":
          return { status: "OK", scannedFiles: 0, newFilesOrganized: 0 };

        case "files.list":
          return {
            items: files,
            total: files.length,
          };

        case "files.search": {
          const q = (payload?.query || "").toLowerCase();
          const filtered = files.filter(
            (f) =>
              f.originalName.toLowerCase().includes(q) ||
              f.clientName?.toLowerCase().includes(q) ||
              f.projectName?.toLowerCase().includes(q) ||
              f.extension.toLowerCase().includes(q)
          );
          return filtered;
        }

        case "clients.list":
          return clients;

        case "clients.create": {
          const newClient = {
            id: `client-${Date.now()}`,
            name: payload.name,
            code: payload.code,
            aliases: payload.aliases || [],
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          clients.push(newClient);
          return newClient;
        }

        case "projects.list":
          return projects;

        case "projects.create": {
          const newProj = {
            id: `proj-${Date.now()}`,
            clientId: payload.clientId,
            name: payload.name,
            category: payload.category || "General",
            year: payload.year || new Date().getFullYear(),
          };
          projects.push(newProj);
          return newProj;
        }

        case "reviewQueue.list":
          return reviewQueue;

        case "reviewQueue.resolve": {
          const foundIdx = reviewQueue.findIndex((r) => r.id === payload.queueId);
          if (foundIdx !== -1) {
            const item = reviewQueue[foundIdx];
            reviewQueue.splice(foundIdx, 1);
            const client = clients.find((c) => c.id === payload.clientId);
            const project = projects.find((p) => p.id === payload.projectId);
            files.unshift({
              id: `file-${Date.now()}`,
              originalName: item.originalName,
              currentPath: `${settings.storage.organizationRoot}\\${client?.name || "Client"}\\${payload.year || 2026}\\${payload.category || "Design"}\\${item.originalName}`,
              extension: item.originalName.split(".").pop() || "dat",
              fileSizeBytes: item.detectedMetadata?.sizeBytes || 5000000,
              version: 1,
              status: "ORGANIZED",
              classificationConfidence: 1.0,
              clientName: client?.name || "Client",
              projectName: project?.name || "Project",
              category: payload.category || "Design",
              createdAt: new Date().toISOString(),
            });
          }
          return { success: true };
        }

        case "folderRules.list":
          return folderRules;

        case "folderRules.create": {
          const newRule = {
            id: `frule-${Date.now()}`,
            name: payload.name,
            scope: payload.scope || "CLIENT",
            colorPreset: payload.colorPreset || "Amber",
            customIconPath: payload.customIconPath || null,
            customColorHex: payload.customColorHex || "#f59e0b",
            priority: payload.priority || 100,
            isActive: payload.isActive !== undefined ? payload.isActive : true,
          };
          folderRules.push(newRule);
          return newRule;
        }

        case "folderRules.delete": {
          folderRules = folderRules.filter((r) => r.id !== payload.id);
          return { success: true };
        }

        case "folderRules.apply":
          return { success: true, count: 3 };

        case "settings.get":
          return settings;

        case "settings.update":
          settings = { ...settings, ...payload };
          return settings;

        default:
          return {};
      }
    },

    openPath: async (p: string) => {
      console.log(`[Browser Mock] Open folder path: ${p}`);
    },

    showItemInFolder: async (p: string) => {
      console.log(`[Browser Mock] Reveal item in folder: ${p}`);
    },

    onEvent: (callback: (event: any) => void) => {
      listeners.push(callback);
      return () => {
        const idx = listeners.indexOf(callback);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },
  };

  console.info(
    "%c[FolderMate]%c Initialized browser mock RPC bridge with live interactive state.",
    "color: #f59e0b; font-weight: bold;",
    "color: #94a3b8;"
  );
}
