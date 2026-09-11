export class FolderMateError extends Error {
  public readonly code: number;
  public readonly details?: unknown;

  constructor(message: string, code: number = 1000, details?: unknown) {
    super(message);
    this.name = "FolderMateError";
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FileLockedError extends FolderMateError {
  constructor(filePath: string) {
    super(`File is currently locked or in use by another application: ${filePath}`, 1002, { filePath });
    this.name = "FileLockedError";
  }
}

export class HashMismatchError extends FolderMateError {
  constructor(expected: string, actual: string, filePath: string) {
    super(`SHA-256 hash verification failed for staged file: ${filePath}`, 1005, {
      expected,
      actual,
      filePath,
    });
    this.name = "HashMismatchError";
  }
}

export class SecurityPathError extends FolderMateError {
  constructor(targetPath: string, rootDir: string) {
    super(`Security path traversal detected: ${targetPath} is outside root directory ${rootDir}`, 1007, {
      targetPath,
      rootDir,
    });
    this.name = "SecurityPathError";
  }
}

export class CorelIntegrationError extends FolderMateError {
  constructor(message: string, details?: unknown) {
    super(message, 2002, details);
    this.name = "CorelIntegrationError";
  }
}
