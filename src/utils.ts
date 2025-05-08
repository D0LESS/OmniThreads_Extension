import * as vscode from 'vscode';
import * as path from 'path';

export function getWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
}

export function getComplianceFilePath(): string | undefined {
    const root = getWorkspaceRoot();
    return root ? path.join(root, "omnivector_workspace") : undefined;
}
