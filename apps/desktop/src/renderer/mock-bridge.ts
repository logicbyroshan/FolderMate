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
      color: "Amber",
      folderPath: "D:\\Clients\\ABC School",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "client-2",
      name: "Apex Healthcare",
      code: "APEXHC",
      aliases: ["APEX", "APEX HOSPITAL", "APEX HEALTH"],
      color: "Blue",
      folderPath: "D:\\Clients\\Apex Healthcare",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "client-3",
      name: "Zenith Corp",
      code: "ZENITH",
      aliases: ["ZENITH CORP", "ZENITH TECH"],
      color: "Purple",
      folderPath: "D:\\Clients\\Zenith Corp",
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
      subfolderPath: "2026\\ID Card",
    },
    {
      id: "proj-2",
      clientId: "client-1",
      name: "Annual Magazine",
      category: "Publication",
      year: 2026,
      subfolderPath: "2026\\Publication",
    },
    {
      id: "proj-3",
      clientId: "client-1",
      name: "Admission Brochure",
      category: "Marketing",
      year: 2025,
      subfolderPath: "2025\\Marketing",
    },
    {
      id: "proj-4",
      clientId: "client-2",
      name: "Staff Identity Card",
      category: "ID Card",
      year: 2026,
      subfolderPath: "2026\\ID Card",
    },
    {
      id: "proj-5",
      clientId: "client-2",
      name: "Hospital Signage & Banner",
      category: "Signage",
      year: 2026,
      subfolderPath: "2026\\Signage",
    },
    {
      id: "proj-6",
      clientId: "client-3",
      name: "Corporate Lanyard",
      category: "Merchandise",
      year: 2025,
      subfolderPath: "2025\\Merchandise",
    },
  ];

  let files = [
    {
      id: "file-1",
      clientId: "client-1",
      projectId: "proj-1",
      filename: "ABC School ID Card 2026 v8.cdr",
      originalName: "abc school id card 2026 v8.cdr",
      currentName: "ABC School ID Card 2026 v8.cdr",
      path: "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v8.cdr",
      currentPath: "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v8.cdr",
      extension: "cdr",
      fileSizeBytes: 24580000,
      sizeBytes: 24580000,
      version: 8,
      versionNumber: 8,
      status: "ORGANIZED",
      classificationConfidence: 0.98,
      clientName: "ABC School",
      projectName: "Student ID Card",
      category: "ID Card",
      categoryName: "ID Card",
      year: 2026,
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      versionChain: [
        { version: 8, name: "ABC School ID Card 2026 v8.cdr", date: "Today, 12:45 PM", isCurrent: true },
        { version: 7, name: "ABC School ID Card 2026 v7.cdr", date: "Yesterday, 4:20 PM" },
        { version: 6, name: "ABC School ID Card 2026 v6.cdr", date: "Sep 10, 2026" },
        { version: 5, name: "ABC School ID Card 2026 v5.cdr", date: "Sep 08, 2026" },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: "file-2",
      clientId: "client-2",
      projectId: "proj-4",
      filename: "Apex Healthcare Staff ID Card 2026 v3.pdf",
      originalName: "apex staff id card 2026 v3.pdf",
      currentName: "Apex Healthcare Staff ID Card 2026 v3.pdf",
      path: "D:\\Clients\\Apex Healthcare\\2026\\ID Card\\Apex Healthcare Staff ID Card 2026 v3.pdf",
      currentPath: "D:\\Clients\\Apex Healthcare\\2026\\ID Card\\Apex Healthcare Staff ID Card 2026 v3.pdf",
      extension: "pdf",
      fileSizeBytes: 4200000,
      sizeBytes: 4200000,
      version: 3,
      versionNumber: 3,
      status: "ORGANIZED",
      classificationConfidence: 0.96,
      clientName: "Apex Healthcare",
      projectName: "Staff Identity Card",
      category: "ID Card",
      categoryName: "ID Card",
      year: 2026,
      sha256Hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      versionChain: [
        { version: 3, name: "Apex Healthcare Staff ID Card 2026 v3.pdf", date: "Today, 11:15 AM", isCurrent: true },
        { version: 2, name: "Apex Healthcare Staff ID Card 2026 v2.pdf", date: "Sep 11, 2026" },
        { version: 1, name: "Apex Healthcare Staff ID Card 2026 v1.pdf", date: "Sep 09, 2026" },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "file-3",
      clientId: "client-3",
      projectId: "proj-6",
      filename: "Zenith Corp Corporate Lanyard 2025 v1.cdr",
      originalName: "zenith lanyard design 2025 v1.cdr",
      currentName: "Zenith Corp Corporate Lanyard 2025 v1.cdr",
      path: "D:\\Clients\\Zenith Corp\\2025\\Merchandise\\Zenith Corp Corporate Lanyard 2025 v1.cdr",
      currentPath: "D:\\Clients\\Zenith Corp\\2025\\Merchandise\\Zenith Corp Corporate Lanyard 2025 v1.cdr",
      extension: "cdr",
      fileSizeBytes: 18900000,
      sizeBytes: 18900000,
      version: 1,
      versionNumber: 1,
      status: "ORGANIZED",
      classificationConfidence: 0.92,
      clientName: "Zenith Corp",
      projectName: "Corporate Lanyard",
      category: "Merchandise",
      categoryName: "Merchandise",
      year: 2025,
      sha256Hash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      versionChain: [
        { version: 1, name: "Zenith Corp Corporate Lanyard 2025 v1.cdr", date: "Aug 28, 2025", isCurrent: true },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: "file-4",
      clientId: "client-1",
      projectId: "proj-2",
      filename: "ABC School Annual Magazine 2026 v2.pdf",
      originalName: "abc magazine final print 2026 v2.pdf",
      currentName: "ABC School Annual Magazine 2026 v2.pdf",
      path: "D:\\Clients\\ABC School\\2026\\Publication\\ABC School Annual Magazine 2026 v2.pdf",
      currentPath: "D:\\Clients\\ABC School\\2026\\Publication\\ABC School Annual Magazine 2026 v2.pdf",
      extension: "pdf",
      fileSizeBytes: 84100000,
      sizeBytes: 84100000,
      version: 2,
      versionNumber: 2,
      status: "ORGANIZED",
      classificationConfidence: 0.95,
      clientName: "ABC School",
      projectName: "Annual Magazine",
      category: "Publication",
      categoryName: "Publication",
      year: 2026,
      sha256Hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      versionChain: [
        { version: 2, name: "ABC School Annual Magazine 2026 v2.pdf", date: "Sep 05, 2026", isCurrent: true },
        { version: 1, name: "ABC School Annual Magazine 2026 v1.pdf", date: "Aug 15, 2026" },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      id: "file-5",
      clientId: "client-2",
      projectId: "proj-5",
      filename: "Apex Healthcare Emergency Signage 2026 v1.ai",
      originalName: "emergency board apex 2026 v1.ai",
      currentName: "Apex Healthcare Emergency Signage 2026 v1.ai",
      path: "D:\\Clients\\Apex Healthcare\\2026\\Signage\\Apex Healthcare Emergency Signage 2026 v1.ai",
      currentPath: "D:\\Clients\\Apex Healthcare\\2026\\Signage\\Apex Healthcare Emergency Signage 2026 v1.ai",
      extension: "ai",
      fileSizeBytes: 38200000,
      sizeBytes: 38200000,
      version: 1,
      versionNumber: 1,
      status: "ORGANIZED",
      classificationConfidence: 0.94,
      clientName: "Apex Healthcare",
      projectName: "Hospital Signage & Banner",
      category: "Signage",
      categoryName: "Signage",
      year: 2026,
      sha256Hash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      versionChain: [
        { version: 1, name: "Apex Healthcare Emergency Signage 2026 v1.ai", date: "Sep 01, 2026", isCurrent: true },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
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

        case "files.list": {
          let res = [...files];
          if (payload?.clientId) {
            res = res.filter((f) => f.clientId === payload.clientId);
          }
          if (payload?.projectId) {
            res = res.filter((f) => f.projectId === payload.projectId);
          }
          return {
            items: res,
            total: res.length,
          };
        }

        case "files.search":
        case "search.query": {
          const q = (typeof payload === "string" ? payload : payload?.query || "").toLowerCase();
          if (!q.trim()) return files;

          const filtered = files.filter(
            (f) =>
              f.filename.toLowerCase().includes(q) ||
              f.originalName.toLowerCase().includes(q) ||
              f.clientName?.toLowerCase().includes(q) ||
              f.projectName?.toLowerCase().includes(q) ||
              f.category?.toLowerCase().includes(q) ||
              f.extension.toLowerCase().includes(q) ||
              String(f.year).includes(q) ||
              `v${f.version}`.toLowerCase().includes(q)
          );
          return filtered;
        }

        case "clients.list":
          return clients;

        case "clients.create": {
          const newClient = {
            id: `client-${Date.now()}`,
            name: payload.name,
            code: payload.code || payload.name.replace(/\s+/g, "").toUpperCase().slice(0, 6),
            aliases: payload.aliases || [],
            color: payload.color || "Amber",
            folderPath: `${settings.storage.organizationRoot}\\${payload.name}`,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          clients.push(newClient);

          // If initial project provided, create it automatically
          if (payload.initialProjectName) {
            projects.push({
              id: `proj-${Date.now()}`,
              clientId: newClient.id,
              name: payload.initialProjectName,
              category: payload.initialProjectCategory || "Design",
              year: payload.initialProjectYear || new Date().getFullYear(),
              subfolderPath: `${payload.initialProjectYear || new Date().getFullYear()}\\${payload.initialProjectCategory || "Design"}`,
            });
          }

          return newClient;
        }

        case "projects.list": {
          if (payload?.clientId) {
            return projects.filter((p) => p.clientId === payload.clientId);
          }
          return projects;
        }

        case "projects.create": {
          const newProj = {
            id: `proj-${Date.now()}`,
            clientId: payload.clientId,
            name: payload.name,
            category: payload.category || "General",
            year: payload.year || new Date().getFullYear(),
            subfolderPath: `${payload.year || new Date().getFullYear()}\\${payload.name}`,
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
              clientId: payload.clientId,
              projectId: payload.projectId,
              filename: item.originalName,
              originalName: item.originalName,
              currentName: item.originalName,
              path: `${settings.storage.organizationRoot}\\${client?.name || "Client"}\\${payload.year || 2026}\\${payload.category || "Design"}\\${item.originalName}`,
              currentPath: `${settings.storage.organizationRoot}\\${client?.name || "Client"}\\${payload.year || 2026}\\${payload.category || "Design"}\\${item.originalName}`,
              extension: item.originalName.split(".").pop() || "dat",
              fileSizeBytes: item.detectedMetadata?.sizeBytes || 5000000,
              sizeBytes: item.detectedMetadata?.sizeBytes || 5000000,
              version: 1,
              versionNumber: 1,
              status: "ORGANIZED",
              classificationConfidence: 1.0,
              clientName: client?.name || "Client",
              projectName: project?.name || "Project",
              category: payload.category || "Design",
              categoryName: payload.category || "Design",
              year: payload.year || 2026,
              sha256Hash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
              versionChain: [{ version: 1, name: item.originalName, date: "Just now", isCurrent: true }],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
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
      console.log(`[Browser Mock] Open folder path in Windows Explorer: ${p}`);
      alert(`[Windows Explorer] Opened folder:\n${p}`);
    },

    showItemInFolder: async (p: string) => {
      console.log(`[Browser Mock] Reveal item in Windows Explorer: ${p}`);
      alert(`[Windows Explorer] Selected file:\n${p}`);
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
