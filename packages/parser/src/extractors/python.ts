import type { Tree, SyntaxNode } from 'tree-sitter';
import type { ParsedAST, ASTFunction, ASTClass, ASTImport, ASTExport } from '@code-analyzer/shared';

export function extractPython(tree: Tree, ast: ParsedAST, content: string): ParsedAST {
  const root = tree.rootNode;
  
  const walk = (node: SyntaxNode) => {
    if (node.type === 'comment') {
      ast.commentLineCount += (node.endPosition.row - node.startPosition.row + 1);
    }
    
    // Top-level statements
    if (node.parent === root && !['function_definition', 'class_definition', 'import_statement', 'import_from_statement', 'comment'].includes(node.type)) {
      ast.topLevelStatements++;
    }

    // Imports
    if (node.type === 'import_statement' || node.type === 'import_from_statement') {
      ast.imports.push(extractImport(node));
    }

    // Classes
    if (node.type === 'class_definition') {
      ast.classes.push(extractClass(node));
      // In Python, all top-level classes are "exported" in the module
      if (node.parent === root) {
        const nameNode = node.childForFieldName('name');
        if (nameNode) ast.exports.push({ name: nameNode.text, type: 'class', line: node.startPosition.row + 1 });
      }
    }

    // Functions
    if (node.type === 'function_definition') {
      // Don't double-count methods
      if (node.parent?.type !== 'block' || node.parent?.parent?.type !== 'class_definition') {
        ast.functions.push(extractFunction(node));
        if (node.parent === root) {
          const nameNode = node.childForFieldName('name');
          if (nameNode) ast.exports.push({ name: nameNode.text, type: 'function', line: node.startPosition.row + 1 });
        }
      }
    }

    for (let i = 0; i < node.childCount; i++) {
      walk(node.child(i)!);
    }
  };

  walk(root);
  return ast;
}

function extractImport(node: SyntaxNode): ASTImport {
  let source = '';
  const specifiers: string[] = [];

  if (node.type === 'import_from_statement') {
    const moduleNameNode = node.childForFieldName('module_name');
    if (moduleNameNode) source = moduleNameNode.text;

    // named imports
    node.children.forEach(c => {
      if (c.type === 'dotted_name' && c !== moduleNameNode) {
        specifiers.push(c.text);
      } else if (c.type === 'aliased_import') {
        const name = c.childForFieldName('name');
        if (name) specifiers.push(name.text);
      }
    });
  } else if (node.type === 'import_statement') {
    node.children.forEach(c => {
      if (c.type === 'dotted_name') {
        source = c.text;
        specifiers.push(c.text);
      } else if (c.type === 'aliased_import') {
        const name = c.childForFieldName('name');
        if (name) {
          source = name.text;
          specifiers.push(name.text);
        }
      }
    });
  }

  return {
    source,
    specifiers,
    isDefault: false,
    isDynamic: false,
    line: node.startPosition.row + 1
  };
}

function extractClass(node: SyntaxNode): ASTClass {
  const nameNode = node.childForFieldName('name');
  const methods: ASTFunction[] = [];
  
  const body = node.childForFieldName('body');
  if (body) {
    for (const child of body.children) {
      if (child.type === 'function_definition') {
        methods.push(extractMethod(child));
      }
    }
  }

  return {
    name: nameNode ? nameNode.text : 'AnonymousClass',
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    methods,
    properties: [],
    isExported: node.parent?.type === 'module'
  };
}

function extractFunction(node: SyntaxNode): ASTFunction {
  const nameNode = node.childForFieldName('name');
  const name = nameNode ? nameNode.text : 'anonymous';
  const isAsync = node.children.some(c => c.type === 'async');

  const parametersNode = node.childForFieldName('parameters');
  const params: string[] = [];
  if (parametersNode) {
    parametersNode.children.forEach(c => {
      if (c.type === 'identifier') {
        params.push(c.text);
      }
    });
  }

  return {
    name,
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    params,
    isAsync,
    isExported: node.parent?.type === 'module',
    complexity: calculateComplexity(node)
  };
}

function extractMethod(node: SyntaxNode): ASTFunction {
  const nameNode = node.childForFieldName('name');
  const name = nameNode ? nameNode.text : 'anonymous';
  const isAsync = node.children.some(c => c.type === 'async');

  const parametersNode = node.childForFieldName('parameters');
  const params: string[] = [];
  if (parametersNode) {
    parametersNode.children.forEach(c => {
      if (c.type === 'identifier') {
        params.push(c.text);
      }
    });
  }

  return {
    name,
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    params,
    isAsync,
    isExported: false,
    complexity: calculateComplexity(node)
  };
}

function calculateComplexity(node: SyntaxNode): number {
  let complexity = 1;
  const walk = (n: SyntaxNode) => {
    if (['if_statement', 'for_statement', 'while_statement', 'try_statement', 'except_clause', 'and', 'or'].includes(n.type)) {
      complexity++;
    }
    for (let i = 0; i < n.childCount; i++) {
      walk(n.child(i)!);
    }
  };
  walk(node);
  return complexity;
}
