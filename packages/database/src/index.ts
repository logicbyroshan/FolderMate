import { createDatabaseConnection, DatabaseOptions, IDatabase } from "./connection.js";
import { runMigrations } from "./migrations/migration-runner.js";
import { ClientsRepository } from "./repositories/clients.repository.js";
import { ProjectsRepository } from "./repositories/projects.repository.js";
import { FilesRepository } from "./repositories/files.repository.js";
import { VersionsRepository } from "./repositories/versions.repository.js";
import { ReviewQueueRepository } from "./repositories/review-queue.repository.js";
import { EventsRepository } from "./repositories/events.repository.js";
import { SearchRepository } from "./repositories/search.repository.js";
import { RulesRepository } from "./repositories/rules.repository.js";

export * from "./connection.js";
export * from "./migrations/migration-runner.js";
export * from "./repositories/clients.repository.js";
export * from "./repositories/projects.repository.js";
export * from "./repositories/files.repository.js";
export * from "./repositories/versions.repository.js";
export * from "./repositories/review-queue.repository.js";
export * from "./repositories/events.repository.js";
export * from "./repositories/search.repository.js";
export * from "./repositories/rules.repository.js";

export class DatabaseManager {
  public readonly db: IDatabase;
  public readonly clients: ClientsRepository;
  public readonly projects: ProjectsRepository;
  public readonly files: FilesRepository;
  public readonly versions: VersionsRepository;
  public readonly reviewQueue: ReviewQueueRepository;
  public readonly events: EventsRepository;
  public readonly search: SearchRepository;
  public readonly rules: RulesRepository;

  constructor(options: DatabaseOptions = {}) {
    this.db = createDatabaseConnection(options);
    this.clients = new ClientsRepository(this.db);
    this.projects = new ProjectsRepository(this.db);
    this.files = new FilesRepository(this.db);
    this.versions = new VersionsRepository(this.db);
    this.reviewQueue = new ReviewQueueRepository(this.db);
    this.events = new EventsRepository(this.db);
    this.search = new SearchRepository(this.db);
    this.rules = new RulesRepository(this.db);
  }

  public runMigrations(customMigrationsDir?: string): string[] {
    return runMigrations(this.db, customMigrationsDir);
  }

  public close(): void {
    this.db.close();
  }
}
