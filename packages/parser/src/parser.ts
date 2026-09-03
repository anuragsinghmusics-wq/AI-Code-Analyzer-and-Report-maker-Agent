import type { CodeFile, ParsedAST } from '@code-analyzer/shared';
import Parser from 'tree-sitter';
import { extractTypeScript } from './extractors/typescript';
import { extractPython } from './extractors/python';
import { detectFileType } from './classifier';

// Lazy loading to avoid unnecessary startup time
let tsParser: Parser | null = null;
let pyParser: Parser | null = null;

export function parseFile(file: CodeFile): ParsedAST {
  const fileType = detectFileType(file);
  const ast: ParsedAST = {
    fileId: file.id,
    language: file.language,
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    lineCount: file.lineCount,
    commentLineCount: 0,
    topLevelStatements: 0,
  };

  if (file.language === 'typescript' || file.language === 'javascript') {
    if (!tsParser) {
      tsParser = new Parser();
      const tsLang = require('tree-sitter-typescript').typescript;
      tsParser.setLanguage(tsLang);
    }
    const tree = tsParser.parse(file.content);
    return extractTypeScript(tree, ast, file.content);
  } else if (file.language === 'python') {
    if (!pyParser) {
      pyParser = new Parser();
      const pyLang = require('tree-sitter-python');
      pyParser.setLanguage(pyLang);
    }
    const tree = pyParser.parse(file.content);
    return extractPython(tree, ast, file.content);
  }

  return ast;
}

export { detectFileType };
