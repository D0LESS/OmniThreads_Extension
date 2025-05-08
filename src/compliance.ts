import * as vscode from 'vscode';
import * as fs from 'fs';
import { getComplianceFilePath } from './utils';
import { COMPLIANCE_FILE } from './config';

export async function checkCompliance(): Promise<boolean> {
    const filePath = getComplianceFilePath();
    if (!filePath) return false;
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            resolve(!err);
        });
    });
}

export async function ensureComplianceFile(): Promise<boolean> {
    const filePath = getComplianceFilePath();
    if (!filePath) return false;
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (!err) {
                resolve(true);
            } else {
                fs.writeFile(filePath, JSON.stringify({ created: new Date().toISOString() }, null, 2), (err) => {
                    resolve(!err);
                });
            }
        });
    });
}
