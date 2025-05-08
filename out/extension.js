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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.logConversation = logConversation;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const config_1 = require("./config");
const cache_1 = require("./cache");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const backendManager_1 = require("./backendManager");
let statusBarItem;
let currentState = 'cached';
function activate(context) {
    console.log("OmniThreads extension activated!");
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = 'OmniThreads: $(sync~spin) Initializing...';
    statusBarItem.show();
    // Initialize temp cache for this session
    const sessionId = (0, config_1.getWorkspaceId)() || Date.now().toString();
    (0, cache_1.initTempCache)(sessionId);
    context.subscriptions.push(vscode.commands.registerCommand('omnithreads.checkCompliance', async () => {
        await updateStatusBar();
        vscode.window.showInformationMessage(getStatusMessage());
    }), vscode.commands.registerCommand('omnithreads.startBackend', () => {
        // Placeholder for backend start logic
    }), vscode.commands.registerCommand('omnithreads.checkBackendStatus', async () => {
        // Placeholder for backend status check
    }));
    // Ensure central directory exists
    if (!fs.existsSync(config_1.OMNIVECTOR_ROOT)) {
        fs.mkdirSync(config_1.OMNIVECTOR_ROOT, { recursive: true });
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
    (0, backendManager_1.registerLogCommand)(context);
}
function getStatusMessage() {
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
        const dataDir = (0, config_1.getWorkspaceDataDir)();
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
        if ((0, cache_1.getCache)().length > 0 && currentState !== 'active') {
            (0, cache_1.moveCacheTo)(dataDir);
        }
        currentState = 'active';
        statusBarItem.text = 'OmniThreads: $(check) 🟢 Active';
    }
    catch (err) {
        currentState = 'failed';
        statusBarItem.text = 'OmniThreads: $(error) 🔴 Failed - Storing in Cache';
        // Fallback: keep caching in memory
    }
}
function logConversation(pair) {
    // If workspace is unsaved or in error, cache it
    if (currentState === 'cached' || currentState === 'failed') {
        (0, cache_1.addToCache)(pair);
    }
    else {
        // Save directly to central storage (or send to backend)
        const dataDir = (0, config_1.getWorkspaceDataDir)();
        if (dataDir) {
            if (!fs.existsSync(dataDir))
                fs.mkdirSync(dataDir, { recursive: true });
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
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
//# sourceMappingURL=extension.js.map