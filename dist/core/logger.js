"use strict";
/**
 * Advanced Coding Tool - 日志管理
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const chalk_1 = __importDefault(require("chalk"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    level;
    prefix;
    constructor(prefix = 'ACT', level = LogLevel.INFO) {
        this.prefix = prefix;
        this.level = level;
    }
    setLevel(level) {
        this.level = level;
    }
    debug(message, ...args) {
        if (this.level <= LogLevel.DEBUG) {
            console.log(chalk_1.default.gray(`[${this.prefix}] DEBUG:`), message, ...args);
        }
    }
    info(message, ...args) {
        if (this.level <= LogLevel.INFO) {
            console.log(chalk_1.default.blue(`[${this.prefix}] INFO:`), message, ...args);
        }
    }
    warn(message, ...args) {
        if (this.level <= LogLevel.WARN) {
            console.log(chalk_1.default.yellow(`[${this.prefix}] WARN:`), message, ...args);
        }
    }
    error(message, ...args) {
        if (this.level <= LogLevel.ERROR) {
            console.log(chalk_1.default.red(`[${this.prefix}] ERROR:`), message, ...args);
        }
    }
    success(message, ...args) {
        console.log(chalk_1.default.green(`[${this.prefix}] SUCCESS:`), message, ...args);
    }
    highlight(message, ...args) {
        console.log(chalk_1.default.cyan.bold(`[${this.prefix}] ${message}`), ...args);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map