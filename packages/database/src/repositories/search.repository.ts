import { Database as DatabaseType } from "better-sqlite3";
import { SearchResultItemDTO } from "@foldermate/shared";

export class SearchRepository {
  constructor(private db: DatabaseType) {}

  public search(query: string, limit: number = 25): SearchResultItemDTO[] {
    if (!query || query.trim().length === 0) return [];

    // Sanitize query for FTS5 (support prefix queries like "abc*")
    const cleanTokens = query
      .trim()
      .replace(/['"]/g, "")
      .split(/\s+/)
      .filter((t) => t.length > 0)
      .map((t) => (t.includes("*") ? t : `${t}*`));

    const ftsQuery = cleanTokens.join(" ");

    const sql = `
      SELECT 
        f.id as file_id,
        f.current_name as filename,
        f.original_name as original_filename,
        c.name as client_name,
        p.name as project_name,
        cat.name as category_name,
        f.year,
        f.version_number as version,
        f.current_path as path,
        f.extension,
        f.size_bytes,
        bm25(files_fts) as rank
      FROM files_fts
      JOIN files f ON files_fts.file_id = f.id
      LEFT JOIN clients c ON f.client_id = c.id
      LEFT JOIN projects p ON f.project_id = p.id
      LEFT JOIN categories cat ON f.category_id = cat.id
      WHERE files_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `;

    try {
      const rows = this.db.prepare(sql).all(ftsQuery, limit) as any[];
      return rows.map((r) => ({
        fileId: r.file_id,
        filename: r.filename,
        originalFilename: r.original_filename,
        clientName: r.client_name || undefined,
        projectName: r.project_name || undefined,
        categoryName: r.category_name || undefined,
        year: r.year || undefined,
        version: r.version,
        path: r.path,
        extension: r.extension,
        sizeBytes: r.size_bytes,
        rank: r.rank,
      }));
    } catch (err) {
      console.warn("[SearchRepository] FTS5 search query error:", err);
      return [];
    }
  }
}
