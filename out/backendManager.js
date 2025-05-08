"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackend = startBackend;
exports.stopBackend = stopBackend;
exports.checkBackendStatus = checkBackendStatus;
exports.logConversationToBackend = logConversationToBackend;
exports.searchConversations = searchConversations;
exports.registerLogCommand = registerLogCommand;
const vscode = __importStar(require("vscode"));
const config_1 = require("./config");
const child_process_1 = require("child_process");
const node_fetch_1 = __importDefault(require("node-fetch"));
let backendProcess = null;
let errorCount = 0;
let outputChannel = null;
function getOutputChannel() {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('OmniThreads Backend');
    }
    return outputChannel;
}
function startBackend() {
    if (backendProcess) {
        vscode.window.showInformationMessage("Backend already running.");
        return;
    }
    backendProcess = (0, child_process_1.spawn)(config_1.BACKEND_START_COMMAND, config_1.BACKEND_START_ARGS, { detached: true });
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
function stopBackend() {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
        vscode.window.showInformationMessage("Backend stopped.");
    }
}
async function checkBackendStatus() {
    try {
        const res = await (0, node_fetch_1.default)(`${config_1.BACKEND_API_BASE}/status`);
        return res.ok;
    }
    catch {
        return false;
    }
}
async function logConversationToBackend(workspaceId, prompt, response) {
    try {
        const res = await (0, node_fetch_1.default)(`${config_1.BACKEND_API_BASE}/log?workspace=${workspaceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, response, compliance: true })
        });
        return res.ok;
    }
    catch (err) {
        console.error("Failed to log conversation to backend:", err);
        return false;
    }
}
async function searchConversations(workspaceId, query, n_results = 5) {
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
        const res = await (0, node_fetch_1.default)(`${config_1.BACKEND_API_BASE}/search?workspace=${workspaceId}&query=${encodeURIComponent(query)}&n_results=${n_results}&full_history=${full_history}`);
        if (!res.ok) {
            errorCount++;
            getOutputChannel().appendLine(`Backend search error: ${res.status} ${res.statusText}`);
            if (errorCount >= 3) {
                vscode.window.showWarningMessage('OmniThreads: Repeated backend errors detected. See the OmniThreads Backend output for details.');
            }
            return [];
        }
        return await res.json();
    }
    catch (err) {
        errorCount++;
        getOutputChannel().appendLine(`Failed to search conversations: ${err}`);
        if (errorCount >= 3) {
            vscode.window.showWarningMessage('OmniThreads: Repeated backend errors detected. See the OmniThreads Backend output for details.');
        }
        return [];
    }
}
function registerLogCommand(context) {
    context.subscriptions.push(vscode.commands.registerCommand('omnithreads.openBackendErrorLog', async () => {
        const wsId = (0, config_1.getWorkspaceId)();
        if (!wsId) {
            vscode.window.showErrorMessage('No workspace found.');
            return;
        }
        const home = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
        const logPath = `${home}/.omnivector_workspaces/${wsId}/semantic/error.log`;
        if (require('fs').existsSync(logPath)) {
            const doc = await vscode.workspace.openTextDocument(logPath);
            vscode.window.showTextDocument(doc);
        }
        else {
            vscode.window.showInformationMessage('No backend error log found for this workspace.');
        }
    }));
}
//# sourceMappingURL=backendManager.js.map