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
const vscode = __importStar(require("vscode"));
const config_1 = require("./config");
const child_process_1 = require("child_process");
const node_fetch_1 = __importDefault(require("node-fetch"));
let backendProcess = null;
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
//# sourceMappingURL=backendManager.js.map