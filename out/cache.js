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
exports.addToCache = addToCache;
exports.getCache = getCache;
exports.clearCache = clearCache;
exports.initTempCache = initTempCache;
exports.moveCacheTo = moveCacheTo;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
let memoryCache = [];
let tempFilePath = null;
function addToCache(item) {
    memoryCache.push(item);
    if (tempFilePath) {
        fs.writeFileSync(tempFilePath, JSON.stringify(memoryCache, null, 2));
    }
}
function getCache() {
    return memoryCache;
}
function clearCache() {
    memoryCache = [];
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
    }
    tempFilePath = null;
}
function initTempCache(sessionId) {
    tempFilePath = path.join(os.tmpdir(), `omnithreads_cache_${sessionId}.json`);
    if (fs.existsSync(tempFilePath)) {
        try {
            memoryCache = JSON.parse(fs.readFileSync(tempFilePath, 'utf-8'));
        }
        catch {
            memoryCache = [];
        }
    }
}
function moveCacheTo(targetDir) {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = path.join(targetDir, 'cache.json');
    fs.writeFileSync(targetFile, JSON.stringify(memoryCache, null, 2));
    clearCache();
}
//# sourceMappingURL=cache.js.map