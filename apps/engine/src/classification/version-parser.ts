export interface ParsedVersionResult {
  versionNumber: number | null;
  confidence: number;
  matchedToken: string | null;
  isQualitative: boolean;
  cleanedBaseName: string;
}

export const VERSION_PATTERNS = [
  // Explicit: v1, v02, v_3, ver.4, version 5, -v6
  {
    regex: /(?:^|[\s_\-.])(?:v|ver|version)[\s_.]*0*(\d+)(?:$|[\s_\-.])/i,
    confidence: 1.0,
    isQualitative: false,
  },
  // Parenthesized version: (v2), (3), [v4]
  {
    regex: /[\(\[]\s*(?:v|ver)?\s*0*(\d+)\s*[\)\]]/i,
    confidence: 0.95,
    isQualitative: false,
  },
  // Trailing digit after separator: project_02, flyer-3
  {
    regex: /[\s_\-]0*(\d+)$/i,
    confidence: 0.80,
    isQualitative: false,
  },
  // Qualitative markers: final, latest, new, updated, print_ready
  {
    regex: /(?:^|[\s_\-.])(final|latest|new|updated|print[\s_\-]*ready|approved)(?:$|[\s_\-.])/i,
    confidence: 0.65,
    isQualitative: true,
  },
];

export function parseVersionFromFilename(filenameWithoutExt: string): ParsedVersionResult {
  for (const pattern of VERSION_PATTERNS) {
    const match = filenameWithoutExt.match(pattern.regex);
    if (match) {
      if (pattern.isQualitative) {
        return {
          versionNumber: null,
          confidence: pattern.confidence,
          matchedToken: match[1],
          isQualitative: true,
          cleanedBaseName: filenameWithoutExt.replace(pattern.regex, " ").replace(/\s+/g, " ").trim(),
        };
      }

      return {
        versionNumber: parseInt(match[1], 10),
        confidence: pattern.confidence,
        matchedToken: match[0].trim(),
        isQualitative: false,
        cleanedBaseName: filenameWithoutExt.replace(pattern.regex, " ").replace(/\s+/g, " ").trim(),
      };
    }
  }

  return {
    versionNumber: null,
    confidence: 0.0,
    matchedToken: null,
    isQualitative: false,
    cleanedBaseName: filenameWithoutExt.trim(),
  };
}
