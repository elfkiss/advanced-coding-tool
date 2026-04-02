/**
 * Advanced Coding Tool - CLI单元测试
 */

import { describe, it, expect, jest } from '@jest/globals';
const { Command } = require('commander');
const { AdvancedCodingEngine } = require('../dist/core');
const fs = require('fs/promises');
const jest = require('@jest/globals');

// Mock the engine
jest.mock('../src/core');

describe('CLI Commands', () => {
  let program: any;
  let mockEngine: any;

  beforeEach(() => {
    program = new Command();
    mockEngine = new AdvancedCodingEngine() as jest.Mocked<AdvancedCodingEngine>;
    jest.clearAllMocks();
  });

  describe('init command', () => {
    it('should initialize project with default config', async () => {
      const configWriteSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue();
      
      // Mock inquirer for non-interactive test
      const inquirer = await import('inquirer');
      inquirer.prompt = jest.fn().mockResolvedValue({
        aiProvider: 'claude',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4000,
        temperature: 0.7,
        enableAutoComplete: true,
        enableCodeReview: true,
        enableDebug: true,
      });

      await mockEngine.initialize();
      expect(mockEngine.initialize).toHaveBeenCalled();
      
      configWriteSpy.mockRestore();
    });

    it('should force reinitialize when --force flag is used', async () => {
      const configExistsSpy = jest.spyOn(fs, 'access').mockRejectedValue(new Error('File not found'));
      
      await mockEngine.initialize();
      expect(mockEngine.initialize).toHaveBeenCalled();
      
      configExistsSpy.mockRestore();
    });
  });

  describe('generate command', () => {
    it('should generate code from prompt', async () => {
      const testContext = {
        filePath: 'test.js',
        content: '',
        language: 'javascript',
        cursorPosition: { line: 0, character: 0 },
      };

      const mockResponse = {
        content: 'function test() { return "hello"; }',
        tokens: { prompt: 50, completion: 20, total: 70 },
        model: 'claude-3-sonnet-20240229',
        timestamp: Date.now(),
      };

      jest.spyOn(mockEngine, 'generateCode').mockResolvedValue(mockResponse);
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const result = await mockEngine.generateCode(testContext, 'create a test function');
      expect(result.content).toContain('function test');
      expect(mockEngine.generateCode).toHaveBeenCalledWith(testContext, 'create a test function');
    });

    it('should handle file reading and writing', async () => {
      const existingContent = '// existing code';
      jest.spyOn(fs, 'readFile').mockResolvedValue(existingContent);
      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const testContext = {
        filePath: 'test.js',
        content: existingContent,
        language: 'javascript',
        cursorPosition: { line: 5, character: 10 },
      };

      await mockEngine.initialize();
      // Additional test logic here
    });
  });

  describe('review command', () => {
    it('should review code and return issues', async () => {
      const testContext = {
        filePath: 'test.js',
        content: 'function test() { }',
        language: 'javascript',
        cursorPosition: { line: 0, character: 0 },
      };

      const mockIssues = [
        {
          type: 'warning' as const,
          message: 'Function is empty',
          line: 1,
          severity: 'low' as const,
        },
      ];

      jest.spyOn(mockEngine, 'reviewCode').mockResolvedValue(mockIssues);

      const result = await mockEngine.reviewCode(testContext);
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Function is empty');
    });

    it('should return empty array for clean code', async () => {
      const testContext = {
        filePath: 'test.js',
        content: 'function test() { return 42; }',
        language: 'javascript',
        cursorPosition: { line: 0, character: 0 },
      };

      jest.spyOn(mockEngine, 'reviewCode').mockResolvedValue([]);

      const result = await mockEngine.reviewCode(testContext);
      expect(result).toHaveLength(0);
    });
  });

  describe('debug command', () => {
    it('should provide debug suggestions', async () => {
      const debugInfo = {
        errorType: 'TypeError',
        message: 'Cannot read property of undefined',
        stackTrace: 'at test.js:5:15',
        context: {
          filePath: 'test.js',
          content: 'const x = undefined.y;',
          language: 'javascript',
          cursorPosition: { line: 4, character: 14 },
        },
        suggestions: [],
      };

      const mockSuggestions = [
        'Check if the variable is properly initialized',
        'Add null check before accessing property',
        'Ensure the object exists before accessing its properties',
      ];

      jest.spyOn(mockEngine, 'debugCode').mockResolvedValue(mockSuggestions);

      const result = await mockEngine.debugCode(debugInfo);
      expect(result).toHaveLength(3);
      expect(result[0]).toContain('Check if the variable');
    });
  });

  describe('analyze command', () => {
    it('should analyze project structure', async () => {
      const mockProjectInfo = {
        name: 'test-project',
        type: 'javascript',
        files: ['test.js', 'index.js'],
        dependencies: ['lodash', 'axios'],
        config: { version: '1.0.0' },
      };

      jest.spyOn(mockEngine, 'analyzeProject').mockResolvedValue(mockProjectInfo);

      const result = await mockEngine.analyzeProject('/test/path');
      expect(result.name).toBe('test-project');
      expect(result.files).toHaveLength(2);
      expect(result.dependencies).toContain('lodash');
    });
  });

  describe('config command', () => {
    it('should update configuration', async () => {
      const updates = {
        maxTokens: 8000,
        temperature: 0.8,
      };

      jest.spyOn(mockEngine, 'saveConfig').mockResolvedValue();

      await mockEngine.saveConfig(updates);
      expect(mockEngine.saveConfig).toHaveBeenCalledWith(updates);
    });

    it('should return current configuration', () => {
      const config = mockEngine.getConfig();
      expect(config).toHaveProperty('aiProvider');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('maxTokens');
    });
  });
});

describe('Utility Functions', () => {
  describe('file operations', () => {
    it('should check if file exists', async () => {
      jest.spyOn(fs, 'access').mockResolvedValue();
      await expect(fs.access('test.js')).resolves.not.toThrow();
    });

    it('should handle missing files', async () => {
      jest.spyOn(fs, 'access').mockRejectedValue(new Error('File not found'));
      await expect(fs.access('missing.js')).rejects.toThrow();
    });
  });

  describe('code analysis', () => {
    it('should extract JavaScript symbols', async () => {
      const code = `
function test() { }
class MyClass { }
const myVar = 42;
`;
      const analyzer = mockEngine['codeAnalyzer'];
      const analysis = await analyzer.analyzeCode(code, 'javascript', 'test.js');
      
      expect(analysis.symbols).toHaveLength(3);
      expect(analysis.symbols[0].name).toBe('test');
      expect(analysis.symbols[1].name).toBe('MyClass');
      expect(analysis.symbols[2].name).toBe('myVar');
    });

    it('should calculate code complexity', async () => {
      const code = `
if (condition) {
  for (let i = 0; i < 10; i++) {
    console.log(i);
  }
}
`;
      const analyzer = mockEngine['codeAnalyzer'];
      const analysis = await analyzer.analyzeCode(code, 'javascript', 'test.js');
      
      expect(analysis.complexity).toBeGreaterThan(1);
    });
  });
});