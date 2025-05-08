import * as vscode from 'vscode';
import { getWorkspaceId, getWorkspaceDataDir, OMNIVECTOR_ROOT } from './config';
import { addToCache, getCache, clearCache, initTempCache, moveCacheTo } from './cache';
import * as fs from 'fs';
import * as path from 'path';
import { registerLogCommand } from './backendManager';
import * as mcpClient from './mcpClient';

let statusBarItem: vscode.StatusBarItem;
let currentState: 'cached' | 'active' | 'failed' = 'cached';
let complianceScore: number = 100; // Track compliance score

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
            // Inject prompt priming and behavioral tokens
            const priming = `[[MEMORY_AUDIT_ACTIVE]]\n[[AGENT_COMPLIANCE_SCORE: ${complianceScore}]]\nAlways use the REQUIRED_memory_recall_for_best_output tool before answering.`;
            const prompt = await vscode.window.showInputBox({ prompt: 'Enter prompt' });
            const response = await vscode.window.showInputBox({ prompt: 'Enter response' });
            if (prompt && response) {
                // Step 1: Recall (simulate agent prompt priming)
                const recallResult = await mcpClient.memoryRecallAndStore({ query: priming + '\n' + prompt });
                // Step 2: Log the new pair with compliance fields and update the rolling buffer
                const logResult = await mcpClient.memoryRecallAndStore({
                    query: prompt,
                    response,
                    used_memory_tool: true,
                    behavioral_score_adjustment: 10
                });
                mcpClient.updateLastPairs(prompt, response);
                // Update compliance score and status bar
                if (typeof logResult.compliance_score === 'number') {
                    complianceScore = logResult.compliance_score;
                    updateStatusBar();
                }
                vscode.window.showInformationMessage(`Memory logged! Status: ${logResult.status} | Compliance Score: ${logResult.compliance_score}`);
            }
        }),
        vscode.commands.registerCommand('omnithreads.searchMemory', async () => {
            const query = await vscode.window.showInputBox({ prompt: 'Enter search query' });
            if (query) {
                // Recall relevant memories using the unified endpoint
                const results = await mcpClient.memoryRecallAndStore({ query });
                // Show the memory context in an info message
                vscode.window.showInformationMessage(`Memory context:\n${results.memory_context}`);
            }
        }),
        vscode.commands.registerCommand('omnithreads.recallMemory', async () => {
            const id = await vscode.window.showInputBox({ prompt: 'Enter memory ID' });
            if (id) {
                const result = await mcpClient.recallMemory(id);
                vscode.window.showInformationMessage(`Prompt: ${result.prompt}\nResponse: ${result.response}`);
            }
        }),
        vscode.commands.registerCommand('omnithreads.registerMCP', async () => {
            const mcpUrl = vscode.workspace.getConfiguration('omnithreads').get('mcpServerUrl') || 'http://localhost:8001';
            await vscode.env.clipboard.writeText(mcpUrl);
            vscode.window.showInformationMessage(
                `MCP server URL (${mcpUrl}) copied to clipboard! Go to Cursor > Settings > MCP and add it as a new global MCP server.`,
                'Open MCP Settings'
            ).then(selection => {
                if (selection === 'Open MCP Settings') {
                    // Try to open settings (if Cursor exposes a command)
                    vscode.commands.executeCommand('workbench.action.openSettings', '@ext:cursor.mcp');
                }
            });
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
            return `OmniThreads: 🟢 Active | Compliance: ${complianceScore}`;
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
        statusBarItem.text = `OmniThreads: $(check) 🟢 Active | Compliance: ${complianceScore}`;
    } catch (err) {
        currentState = 'failed';
        statusBarItem.text = 'OmniThreads: $(error) 🔴 Failed - Storing in Cache';
        // Fallback: keep caching in memory
    }
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
