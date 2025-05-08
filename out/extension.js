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
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const compliance_1 = require("./compliance");
const backendManager_1 = require("./backendManager");
let statusBarItem;
function activate(context) {
    console.log("OmniThreads extension activated!"); // Debug log for activation
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = 'OmniVector: $(sync~spin) Checking...';
    statusBarItem.show();
    context.subscriptions.push(vscode.commands.registerCommand('omnithreads.checkCompliance', async () => {
        const compliant = await (0, compliance_1.checkCompliance)();
        vscode.window.showInformationMessage(compliant ? "Workspace is compliant." : "Workspace is NOT compliant.");
    }), vscode.commands.registerCommand('omnithreads.startBackend', () => {
        (0, backendManager_1.startBackend)();
    }), vscode.commands.registerCommand('omnithreads.checkBackendStatus', async () => {
        const ok = await (0, backendManager_1.checkBackendStatus)();
        vscode.window.showInformationMessage(ok ? "Backend is running." : "Backend is NOT running.");
    }));
    // On activation, check compliance and update status bar
    updateStatusBar();
}
async function updateStatusBar() {
    const compliant = await (0, compliance_1.checkCompliance)();
    statusBarItem.text = compliant
        ? 'OmniVector: $(check) Compliant'
        : 'OmniVector: $(error) Not Compliant';
}
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
//# sourceMappingURL=extension.js.map