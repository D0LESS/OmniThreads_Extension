import * as vscode from 'vscode';
import { BACKEND_START_COMMAND, BACKEND_START_ARGS, BACKEND_API_BASE, getWorkspaceId } from './config';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fetch from 'node-fetch';

let backendProcess: ChildProcessWithoutNullStreams | null = null;
let errorCount = 0;
let outputChannel: vscode.OutputChannel | null = null;

function getOutputChannel() {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('OmniThreads Backend');
    }
    return outputChannel;
}

export function startBackend(): void {
    if (backendProcess) {
        vscode.window.showInformationMessage("Backend already running.");
        return;
    }
    backendProcess = spawn(BACKEND_START_COMMAND, BACKEND_START_ARGS, { detached: true });
    backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend] ${data}`);
    });
    backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend ERROR] ${data}`);
    });
    backendProcess.on('close', (code) => {
        backendProcess = null;
        vscode.window.showWarningMessage(`Backend process exited with code ${code}`);
    });
    vscode.window.showInformationMessage("Backend started.");
}

export function stopBackend(): void {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
        vscode.window.showInformationMessage("Backend stopped.");
    }
}

export async function checkBackendStatus(): Promise<boolean> {
    try {
        const res = await fetch(`${BACKEND_API_BASE}/status`);
        return res.ok;
    } catch {
        return false;
    }
}

export async function logConversationToBackend(workspaceId: string, prompt: string, response: string): Promise<boolean> {
    try {
        const res = await fetch(`${BACKEND_API_BASE}/log?workspace=${workspaceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, response, compliance: true })
        });
        return res.ok;
    } catch (err) {
        console.error("Failed to log conversation to backend:", err);
        return false;
    }
}

export async function searchConversations(workspaceId: string, query: string, n_results = 5): Promise<any[]> {
    // Detect natural language triggers for full history search
    const fullHistoryTriggers = [
        /look back in (our|the) history/i,
        /find the previous conversation/i,
        /when we were working on/i,
        /search all history/i,
        /search everything/i,
        /go back to/i,
        /older conversations?/i,
        /past discussions?/i,
        /from earlier/i
    ];
    const full_history = fullHistoryTriggers.some(re => re.test(query));
    try {
        const res = await fetch(`${BACKEND_API_BASE}/search?workspace=${workspaceId}&query=${encodeURIComponent(query)}&n_results=${n_results}&full_history=${full_history}`);
        if (!res.ok) {
            errorCount++;
            getOutputChannel().appendLine(`Backend search error: ${res.status} ${res.statusText}`);
            if (errorCount >= 3) {
                vscode.window.showWarningMessage('OmniThreads: Repeated backend errors detected. See the OmniThreads Backend output for details.');
            }
            return [];
        }
        return await res.json();
    } catch (err) {
        errorCount++;
        getOutputChannel().appendLine(`Failed to search conversations: ${err}`);
        if (errorCount >= 3) {
            vscode.window.showWarningMessage('OmniThreads: Repeated backend errors detected. See the OmniThreads Backend output for details.');
        }
        return [];
    }
}

export function registerLogCommand(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('omnithreads.openBackendErrorLog', async () => {
            const wsId = getWorkspaceId();
            if (!wsId) {
                vscode.window.showErrorMessage('No workspace found.');
                return;
            }
            const home = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
            const logPath = `${home}/.omnivector_workspaces/${wsId}/semantic/error.log`;
            if (require('fs').existsSync(logPath)) {
                const doc = await vscode.workspace.openTextDocument(logPath);
                vscode.window.showTextDocument(doc);
            } else {
                vscode.window.showInformationMessage('No backend error log found for this workspace.');
            }
        })
    );
}
