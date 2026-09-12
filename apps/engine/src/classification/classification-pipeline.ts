import path from "path";
import { DatabaseManager } from "@foldermate/database";
import { parseVersionFromFilename } from "./version-parser.js";
import { extractTemporalInfo } from "./temporal-extractor.js";
import { findBestDictionaryMatch, MatchCandidate } from "./fuzzy-matcher.js";
import { evaluateConfidence, ConfidenceEvaluation } from "./confidence-scorer.js";

export interface ClassificationResult {
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  categoryName?: string;
  year: number;
  month?: number;
  versionNumber: number;
  confidence: ConfidenceEvaluation;
  extractedTokens: string[];
}

export class ClassificationPipeline {
  constructor(private db: DatabaseManager) {}

  public async classifyFile(filePath: string, fileMtimeMs?: number): Promise<ClassificationResult> {
    const filename = path.basename(filePath);
    const parsedPath = path.parse(filename);
    const rawBaseName = parsedPath.name;

    // 1. Extract Version information
    const versionInfo = parseVersionFromFilename(rawBaseName);
    const cleanedBaseName = versionInfo.cleanedBaseName;

    // 2. Tokenize base name (split by spaces, underscores, dashes, dots)
    const tokens = cleanedBaseName
      .split(/[\s_\-.]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // 3. Extract Temporal Information (Year / Month)
    const temporal = extractTemporalInfo(filename, fileMtimeMs);

    // 4. Query Client Dictionaries
    const activeClients = this.db.clients.list(true);
    const clientCandidates: MatchCandidate[] = activeClients.map((c) => ({
      name: c.name,
      code: c.code,
      aliases: c.aliases,
      data: c,
    }));

    const clientMatch = findBestDictionaryMatch(tokens, clientCandidates, 1);
    let matchedClient = clientMatch.match ? clientMatch.match.data : null;

    // 5. Query Project Dictionaries for matched client
    let matchedProject: any = null;
    let projectScore = 0.0;

    if (matchedClient) {
      const clientProjects = this.db.projects.listByClient(matchedClient.id);
      const projectCandidates: MatchCandidate[] = clientProjects.map((p) => ({
        name: p.name,
        code: p.code || undefined,
        aliases: [],
        data: p,
      }));

      const projectMatch = findBestDictionaryMatch(tokens, projectCandidates, 1);
      if (projectMatch.match) {
        matchedProject = projectMatch.match.data;
        projectScore = projectMatch.confidence;
      }
    } else {
      // Look across all projects to infer client if possible
      const allProjects = this.db.projects.listAll();
      const projectCandidates: MatchCandidate[] = allProjects.map((p) => ({
        name: p.name,
        code: p.code || undefined,
        aliases: [],
        data: p,
      }));

      const projectMatch = findBestDictionaryMatch(tokens, projectCandidates, 1);
      if (projectMatch.match) {
        matchedProject = projectMatch.match.data;
        projectScore = projectMatch.confidence * 0.9;
        // Lookup parent client
        matchedClient = this.db.clients.getById(matchedProject.clientId);
      }
    }

    // 6. Compute Version Number resolution
    let versionNumber = versionInfo.versionNumber ?? 1;

    // 7. Calculate Composite Confidence Score
    const confidence = evaluateConfidence({
      clientScore: matchedClient ? clientMatch.confidence : 0.0,
      projectScore: matchedProject ? projectScore : 0.0,
      yearScore: temporal.confidence,
      versionScore: versionInfo.confidence,
    });

    return {
      clientId: matchedClient?.id,
      clientName: matchedClient?.name,
      projectId: matchedProject?.id,
      projectName: matchedProject?.name || "General",
      categoryName: matchedProject?.category || "Design",
      year: temporal.year,
      month: temporal.month,
      versionNumber,
      confidence,
      extractedTokens: tokens,
    };
  }
}
