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
exports.OMNIVECTOR_ROOT = exports.BACKEND_START_ARGS = exports.BACKEND_START_COMMAND = exports.BACKEND_API_BASE = exports.BACKEND_HOST = exports.BACKEND_PORT = exports.COMPLIANCE_FILE = void 0;
exports.getWorkspaceId = getWorkspaceId;
exports.getWorkspaceDataDir = getWorkspaceDataDir;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const crypto = __importStar(require("crypto"));
exports.COMPLIANCE_FILE = "omnivector_workspace";
exports.BACKEND_PORT = 8000;
exports.BACKEND_HOST = "127.0.0.1";
exports.BACKEND_API_BASE = `http://${exports.BACKEND_HOST}:${exports.BACKEND_PORT}`;
exports.BACKEND_START_COMMAND = "python";
exports.BACKEND_START_ARGS = [
    "-m",
    "Pseudovector.utils.session_bootstrapper",
    "--port",
    exports.BACKEND_PORT.toString()
];
exports.OMNIVECTOR_ROOT = path.join(os.homedir(), '.omnivector_workspaces');
function getWorkspaceId() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0)
        return null;
    // Use VS Code workspace file if available, else hash the path
    const ws = vscode.workspace.workspaceFile;
    if (ws) {
        return crypto.createHash('sha256').update(ws.fsPath).digest('hex');
    }
    else {
        return crypto.createHash('sha256').update(folders[0].uri.fsPath).digest('hex');
    }
}
function getWorkspaceDataDir() {
    const id = getWorkspaceId();
    return id ? path.join(exports.OMNIVECTOR_ROOT, id) : null;
}
//# sourceMappingURL=config.js.map