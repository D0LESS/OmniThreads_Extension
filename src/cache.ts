import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let memoryCache: any[] = [];
let tempFilePath: string | null = null;

export function addToCache(item: any) {
    memoryCache.push(item);
    if (tempFilePath) {
        fs.writeFileSync(tempFilePath, JSON.stringify(memoryCache, null, 2));
    }
}

export function getCache(): any[] {
    return memoryCache;
}

export function clearCache() {
    memoryCache = [];
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
    }
    tempFilePath = null;
}

export function initTempCache(sessionId: string) {
    tempFilePath = path.join(os.tmpdir(), `omnithreads_cache_${sessionId}.json`);
    if (fs.existsSync(tempFilePath)) {
        try {
            memoryCache = JSON.parse(fs.readFileSync(tempFilePath, 'utf-8'));
        } catch {
            memoryCache = [];
        }
    }
}

export function moveCacheTo(targetDir: string) {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = path.join(targetDir, 'cache.json');
    fs.writeFileSync(targetFile, JSON.stringify(memoryCache, null, 2));
    clearCache();
} 