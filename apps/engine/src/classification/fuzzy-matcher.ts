/**
 * Computes the Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];

  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

export interface MatchCandidate {
  name: string;
  code?: string;
  aliases: string[];
  data: any;
}

export interface MatchResult<T = any> {
  match: T | null;
  matchedString: string | null;
  confidence: number;
  matchType: "exact" | "code" | "alias" | "fuzzy" | "acronym" | "none";
}

/**
 * Matches extracted filename tokens against candidate dictionaries using a multi-tiered fuzzy search.
 */
export function findBestDictionaryMatch<T extends MatchCandidate>(
  inputTokens: string[],
  candidates: T[],
  maxFuzzyDistance: number = 1
): MatchResult<T> {
  const normalizedInput = inputTokens.join(" ").toLowerCase();

  // 1. Exact Name Match (Whole phrase in input)
  for (const c of candidates) {
    const candidateName = c.name.toLowerCase();
    if (normalizedInput.includes(candidateName)) {
      return {
        match: c,
        matchedString: c.name,
        confidence: 1.0,
        matchType: "exact",
      };
    }
  }

  // 2. Exact Code Match (e.g. "ABCSCH")
  for (const c of candidates) {
    if (c.code) {
      const code = c.code.toLowerCase();
      if (inputTokens.some((t) => t.toLowerCase() === code)) {
        return {
          match: c,
          matchedString: c.code,
          confidence: 0.98,
          matchType: "code",
        };
      }
    }
  }

  // 3. Registered Alias Match (e.g. "ABC")
  for (const c of candidates) {
    for (const alias of c.aliases) {
      const aliasLower = alias.toLowerCase();
      // Match alias as a distinct token or subphrase
      if (inputTokens.some((t) => t.toLowerCase() === aliasLower) || normalizedInput.includes(aliasLower)) {
        return {
          match: c,
          matchedString: alias,
          confidence: 0.95,
          matchType: "alias",
        };
      }
    }
  }

  // 4. Fuzzy Levenshtein Distance on multi-character tokens
  for (const c of candidates) {
    const candidateTokens = c.name.toLowerCase().split(/\s+/);
    for (const cToken of candidateTokens) {
      if (cToken.length < 3) continue;

      for (const inToken of inputTokens) {
        if (inToken.length < 3) continue;
        const dist = levenshteinDistance(inToken.toLowerCase(), cToken);
        if (dist <= maxFuzzyDistance && dist > 0) {
          return {
            match: c,
            matchedString: inToken,
            confidence: 0.82,
            matchType: "fuzzy",
          };
        }
      }
    }
  }

  return {
    match: null,
    matchedString: null,
    confidence: 0.0,
    matchType: "none",
  };
}
