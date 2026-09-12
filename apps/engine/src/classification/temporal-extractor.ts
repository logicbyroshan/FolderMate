export interface ExtractedTemporalInfo {
  year: number;
  month?: number;
  confidence: number;
  matchedToken?: string;
}

export function extractTemporalInfo(filename: string, fileMtimeMs?: number): ExtractedTemporalInfo {
  // 1. Year-Month pattern first: 2026-09, 2026_09, 2026.09, 2026-11
  const yearMonthMatch = filename.match(/(?:^|[\s_\-.])(20[2-3][0-9])[\-_.]?(0[1-9]|1[0-2])(?:$|[\s_\-.])/);
  if (yearMonthMatch) {
    return {
      year: parseInt(yearMonthMatch[1], 10),
      month: parseInt(yearMonthMatch[2], 10),
      confidence: 1.0,
      matchedToken: yearMonthMatch[0].trim(),
    };
  }

  // 2. Explicit standalone 4-digit year (2020 - 2035)
  const explicitYearMatch = filename.match(/(?:^|[\s_\-.])(20[2-3][0-9])(?:$|[\s_\-.])/);
  if (explicitYearMatch) {
    return {
      year: parseInt(explicitYearMatch[1], 10),
      confidence: 1.0,
      matchedToken: explicitYearMatch[1],
    };
  }

  // 3. Fallback to file creation / modification date
  const fallbackDate = fileMtimeMs ? new Date(fileMtimeMs) : new Date();
  return {
    year: fallbackDate.getFullYear(),
    month: fallbackDate.getMonth() + 1,
    confidence: 0.60,
  };
}
