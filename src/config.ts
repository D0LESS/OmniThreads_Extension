import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as crypto from 'crypto';

export const COMPLIANCE_FILE = "omnivector_workspace";
export const BACKEND_PORT = 8000;
export const BACKEND_HOST = "127.0.0.1";
export const BACKEND_API_BASE = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
export const BACKEND_START_COMMAND = "python";
export const BACKEND_START_ARGS = [
    "-m",
    "Pseudovector.utils.session_bootstrapper",
    "--port",
    BACKEND_PORT.toString()
];

export const OMNIVECTOR_ROOT = path.join(os.homedir(), '.omnivector_workspaces');

export function getWorkspaceId(): string | null {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return null;
    // Use VS Code workspace file if available, else hash the path
    const ws = vscode.workspace.workspaceFile;
    if (ws) {
        return crypto.createHash('sha256').update(ws.fsPath).digest('hex');
    } else {
        return crypto.createHash('sha256').update(folders[0].uri.fsPath).digest('hex');
    }
}

export function getWorkspaceDataDir(): string | null {
    const id = getWorkspaceId();
    return id ? path.join(OMNIVECTOR_ROOT, id) : null;
}
