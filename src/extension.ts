import * as vscode from 'vscode';
import { getWorkspaceId, getWorkspaceDataDir, OMNIVECTOR_ROOT } from './config';
import { addToCache, getCache, clearCache, initTempCache, moveCacheTo } from './cache';
import * as fs from 'fs';
import * as path from 'path';
import { registerLogCommand } from './backendManager';
import * as mcpClient from './mcpClient';
import { ensureContextFile, watchContextFile } from '../omnivector_workspace/context_manager';

let statusBarItem: vscode.StatusBarItem;
let currentState: 'cached' | 'active' | 'failed' = 'cached';

export function activate(context: vscode.ExtensionContext) {
    console.log("OmniThreads extension activated!");
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = 'OmniThreads: $(sync~spin) Initializing...';
    statusBarItem.tooltip = 'OmniThreads: Vector memory and compliance status';
    statusBarItem.show();

    // Initialize temp cache for this session
    const sessionId = getWorkspaceId() || Date.now().toString();
    initTempCache(sessionId);

    context.subscriptions.push(
        vscode.commands.registerCommand('omnithreads.checkCompliance', async () => {
            await updateStatusBar();
            vscode.window.showInformationMessage(getStatusMessage());
        }),
        vscode.commands.registerCommand('omnithreads.startBackend', () => {
            // Placeholder for backend start logic
        }),
        vscode.commands.registerCommand('omnithreads.checkBackendStatus', async () => {
            // Placeholder for backend status check
        }),
        vscode.commands.registerCommand('omnithreads.addMemory', async () => {
            const prompt = await vscode.window.showInputBox({ prompt: 'Enter prompt' });
            const response = await vscode.window.showInputBox({ prompt: 'Enter response' });
            if (prompt && response) {
                try {
                    const result = await mcpClient.memoryRecallAndStore({ query: prompt, response });
                    vscode.window.showInformationMessage(`Memory added! ID: ${result.logged?.id}`);
                } catch (err: any) {
                    vscode.window.showErrorMessage('Failed to add memory. Please ensure the MCP server is running and try again.');
                }
            } else {
                vscode.window.showWarningMessage('Prompt and response are required.');
            }
        }),
        vscode.commands.registerCommand('omnithreads.searchMemory', async () => {
            const query = await vscode.window.showInputBox({ prompt: 'Enter search query' });
            if (query) {
                try {
                    const results = await mcpClient.memoryRecallAndStore({ query });
                    if ((results.recalled || []).length === 0) {
                        vscode.window.showInformationMessage('No relevant memories found.');
                    } else {
                        vscode.window.showQuickPick((results.recalled || []).map((r: any) => `${r.prompt} → ${r.response}`), { placeHolder: 'Search results' });
                    }
                } catch (err: any) {
                    vscode.window.showErrorMessage('Failed to search memory. Please ensure the MCP server is running and try again.');
                }
            } else {
                vscode.window.showWarningMessage('Search query is required.');
            }
        }),
        vscode.commands.registerCommand('omnithreads.recallMemory', async () => {
            const id = await vscode.window.showInputBox({ prompt: 'Enter memory ID' });
            if (id) {
                try {
                    const results = await mcpClient.memoryRecallAndStore({ query: '' });
                    const found = (results.recalled || []).find((r: any) => r.id === id);
                    if (found) {
                        vscode.window.showInformationMessage(`Prompt: ${found.prompt}\nResponse: ${found.response}`);
                    } else {
                        vscode.window.showWarningMessage('Memory not found.');
                    }
                } catch (err: any) {
                    vscode.window.showErrorMessage('Failed to recall memory. Please ensure the MCP server is running and try again.');
                }
            } else {
                vscode.window.showWarningMessage('Memory ID is required.');
            }
        })
    );

    // Ensure central directory exists
    if (!fs.existsSync(OMNIVECTOR_ROOT)) {
        fs.mkdirSync(OMNIVECTOR_ROOT, { recursive: true });
    }

    // On activation, update status bar
    updateStatusBar();

    // Listen for workspace save events to transition from cached to active
    vscode.workspace.onDidSaveTextDocument(() => {
        updateStatusBar();
    });
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
        updateStatusBar();
    });

    registerLogCommand(context);

    setupProjectContextWatcher();

    // Listen for workspace save events to transition from cached to active
    vscode.workspace.onDidSaveTextDocument(() => {
        setupProjectContextWatcher();
    });
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
        setupProjectContextWatcher();
    });
}

function getStatusMessage(): string {
    switch (currentState) {
        case 'active':
            return 'OmniThreads: 🟢 Active (workspace data stored centrally)';
        case 'failed':
            return 'OmniThreads: 🔴 Failed - Storing in Cache (will attempt to recover)';
        default:
            return 'OmniThreads: 🟡 Cached (unsaved or error, data is temporary)';
    }
}

async function updateStatusBar() {
    try {
        const dataDir = getWorkspaceDataDir();
        if (!dataDir) {
            currentState = 'cached';
            statusBarItem.text = 'OmniThreads: $(warning) 🟡 Cached';
            return;
        }
        // Try to ensure the data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        // If we have cached data and just became active, move it
        if (getCache().length > 0 && currentState !== 'active') {
            moveCacheTo(dataDir);
        }
        currentState = 'active';
        statusBarItem.text = 'OmniThreads: $(check) 🟢 Active';
    } catch (err) {
        currentState = 'failed';
        statusBarItem.text = 'OmniThreads: $(error) 🔴 Failed - Storing in Cache';
        // Fallback: keep caching in memory
    }
}

export function logConversation(pair: any) {
    // If workspace is unsaved or in error, cache it
    if (currentState === 'cached' || currentState === 'failed') {
        addToCache(pair);
    } else {
        // Save directly to central storage (or send to backend)
        const dataDir = getWorkspaceDataDir();
        if (dataDir) {
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const file = path.join(dataDir, 'conversations.json');
            let arr = [];
            if (fs.existsSync(file)) {
                arr = JSON.parse(fs.readFileSync(file, 'utf-8'));
            }
            arr.push(pair);
            fs.writeFileSync(file, JSON.stringify(arr, null, 2));
        }
    }
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

function setupProjectContextWatcher() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return;
    const root = folders[0].uri.fsPath;
    ensureContextFile(root);
    watchContextFile(root);
}
