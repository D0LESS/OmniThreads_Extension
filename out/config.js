"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKEND_START_ARGS = exports.BACKEND_START_COMMAND = exports.BACKEND_API_BASE = exports.BACKEND_HOST = exports.BACKEND_PORT = exports.COMPLIANCE_FILE = void 0;
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
//# sourceMappingURL=config.js.map