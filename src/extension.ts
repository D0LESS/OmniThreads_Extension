import * as vscode from 'vscode';
import { getWorkspaceId, getWorkspaceDataDir, OMNIVECTOR_ROOT } from './config';
import { addToCache, getCache, clearCache, initTempCache, moveCacheTo } from './cache';
import * as fs from 'fs';
import * as path from 'path';
import { registerLogCommand } from './backendManager';
import * as mcpClient from './mcpClient';

let statusBarItem: vscode.StatusBarItem;
let currentState: 'cached' | 'active' | 'failed' = 'cached';

export function activate(context: vscode.ExtensionContext) {
    console.log("OmniThreads extension activated!");
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = 'OmniThreads: $(sync~spin) Initializing...';
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
                const result = await mcpClient.addMemory(prompt, response);
                vscode.window.showInformationMessage(`Memory added! ID: ${result.id}`);
            }
        }),
        vscode.commands.registerCommand('omnithreads.searchMemory', async () => {
            const query = await vscode.window.showInputBox({ prompt: 'Enter search query' });
            if (query) {
                const results = await mcpClient.searchMemory(query);
                vscode.window.showQuickPick(results.map((r: any) => `${r.prompt} → ${r.response}`), { placeHolder: 'Search results' });
            }
        }),
        vscode.commands.registerCommand('omnithreads.recallMemory', async () => {
            const id = await vscode.window.showInputBox({ prompt: 'Enter memory ID' });
            if (id) {
                const result = await mcpClient.recallMemory(id);
                vscode.window.showInformationMessage(`Prompt: ${result.prompt}\nResponse: ${result.response}`);
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
