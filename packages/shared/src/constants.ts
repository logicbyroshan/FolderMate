export const DEFAULT_INBOX_DIR = "C:\\FolderMate\\Inbox";
export const DEFAULT_STORAGE_DIR = "D:\\Clients";
export const DEFAULT_ARCHIVE_DIR = "D:\\Archive";

export const NAMED_PIPE_PATH = "\\\\.\\pipe\\foldermate-ipc";
export const WEBSOCKET_PORT = 49221;

export const IGNORED_FILE_REGEXES = [
  /^~\$.*/i,                   // Office temporary lock files
  /\.tmp$/i,                   // Generic temporary
  /\.crswap$/i,                // Chrome/Electron swap
  /\.part$/i,                  // Incomplete downloads
  /\.partial$/i,
  /\.download$/i,
  /^@.*\.cdr$/i,               // CorelDRAW backup lock
  /.*\.autosave\.cdr$/i,       // CorelDRAW autosave
  /.*_auto_backup\.cdr$/i,
  /\.idlk$/i,                  // Adobe InDesign lock
  /\.lock$/i,
  /^Thumbs\.db$/i,             // Windows Explorer thumbnail cache
  /^desktop\.ini$/i,           // Windows folder customization
  /^\.foldermate_.*/i,         // FolderMate internal staging
];

export const ILLEGAL_WINDOWS_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
export const RESERVED_WINDOWS_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
