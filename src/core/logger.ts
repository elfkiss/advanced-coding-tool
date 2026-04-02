/**
 * Advanced Coding Tool - 日志管理
 */

import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = 'ACT', level: LogLevel = LogLevel.INFO) {
    this.prefix = prefix;
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(`[${this.prefix}] DEBUG:`), message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.blue(`[${this.prefix}] INFO:`), message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.log(chalk.yellow(`[${this.prefix}] WARN:`), message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.log(chalk.red(`[${this.prefix}] ERROR:`), message, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    console.log(chalk.green(`[${this.prefix}] SUCCESS:`), message, ...args);
  }

  highlight(message: string, ...args: any[]): void {
    console.log(chalk.cyan.bold(`[${this.prefix}] ${message}`), ...args);
  }
}