import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseFile, detectFileType } from '../src/index';
import type { CodeFile } from '@code-analyzer/shared';

const loadFixture = (filename: string, language: 'typescript' | 'python'): CodeFile => {
  const content = fs.readFileSync(path.join(__dirname, 'fixtures', filename), 'utf-8');
  return {
    id: filename, // dummy id
    path: `src/${filename}`,
    content,
    language,
    lineCount: content.split('\n').length,
    sizeBytes: content.length,
    isEntryPoint: false,
  };
};

describe('Parser - TypeScript', () => {
  it('parses a controller correctly', () => {
    const file = loadFixture('ts-controller.ts', 'typescript');
    expect(detectFileType(file)).toBe('controller');

    const ast = parseFile(file);
    expect(ast.language).toBe('typescript');
    
    // Classes
    expect(ast.classes.length).toBe(1);
    expect(ast.classes[0].name).toBe('UserController');
    expect(ast.classes[0].isExported).toBe(true);
    expect(ast.classes[0].methods.length).toBe(3); // constructor, findAll, findOne

    const findOneMethod = ast.classes[0].methods.find(m => m.name === 'findOne');
    expect(findOneMethod).toBeDefined();
    expect(findOneMethod!.params).toEqual(['id: string']);
    expect(findOneMethod!.isAsync).toBe(true);
    expect(findOneMethod!.complexity).toBeGreaterThan(1);

    // Functions
    expect(ast.functions.length).toBe(1);
    expect(ast.functions[0].name).toBe('helperFn');
    expect(ast.functions[0].isExported).toBe(true);

    // Imports
    expect(ast.imports.length).toBe(1);
    expect(ast.imports[0].source).toBe('@nestjs/common');
    expect(ast.imports[0].specifiers).toContain('Controller');
    expect(ast.imports[0].specifiers).toContain('Get');

    // Exports
    expect(ast.exports.map(e => e.name)).toContain('UserController');
    expect(ast.exports.map(e => e.name)).toContain('helperFn');
  });

  it('parses a service correctly', () => {
    const file = loadFixture('ts-service.ts', 'typescript');
    expect(detectFileType(file)).toBe('service');

    const ast = parseFile(file);
    expect(ast.classes.length).toBe(1);
    expect(ast.classes[0].name).toBe('UserService');
    expect(ast.imports.length).toBe(2);
  });

  it('parses utilities correctly', () => {
    const file = loadFixture('ts-utils.ts', 'typescript');
    expect(detectFileType(file)).toBe('utility');

    const ast = parseFile(file);
    expect(ast.functions.length).toBe(2);
    expect(ast.functions.map(f => f.name)).toContain('sleep');
    expect(ast.functions.map(f => f.name)).toContain('parseData');
    
    const parseData = ast.functions.find(f => f.name === 'parseData');
    expect(parseData!.complexity).toBe(2); // try/catch
    
    expect(ast.exports.length).toBe(3); // MAX_RETRY, sleep, parseData
  });
});

describe('Parser - Python', () => {
  it('parses a model correctly', () => {
    const file = loadFixture('py-model.py', 'python');
    expect(detectFileType(file)).toBe('model');

    const ast = parseFile(file);
    expect(ast.language).toBe('python');
    
    // Classes
    expect(ast.classes.length).toBe(1);
    expect(ast.classes[0].name).toBe('User');
    expect(ast.classes[0].isExported).toBe(true);
    expect(ast.classes[0].methods.length).toBe(2); // __str__, is_active

    // Imports
    expect(ast.imports.length).toBe(2);
    expect(ast.imports.map(i => i.source)).toContain('django.db');
    expect(ast.imports.map(i => i.source)).toContain('uuid');
  });

  it('parses a script correctly', () => {
    const file = loadFixture('py-script.py', 'python');
    expect(detectFileType(file)).toBe('unknown'); // Doesn't match our heuristics, which is fine

    const ast = parseFile(file);
    expect(ast.functions.length).toBe(1);
    expect(ast.functions[0].name).toBe('main');
    expect(ast.functions[0].complexity).toBe(3); // 1 base + 1 if + 1 for
    
    expect(ast.imports.length).toBe(3);
  });
});
