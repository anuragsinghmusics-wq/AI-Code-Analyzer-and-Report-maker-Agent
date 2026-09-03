import type { Tree, SyntaxNode } from 'tree-sitter';
import type { ParsedAST, ASTFunction, ASTClass, ASTImport, ASTExport } from '@code-analyzer/shared';

export function extractTypeScript(tree: Tree, ast: ParsedAST, content: string): ParsedAST {
  const root = tree.rootNode;
  
  // Basic tree walker
  const walk = (node: SyntaxNode) => {
    if (node.type === 'comment') {
      ast.commentLineCount += (node.endPosition.row - node.startPosition.row + 1);
    }
    
    // Top-level statements (heuristic)
    if (node.parent === root && !['function_declaration', 'class_declaration', 'import_statement', 'export_statement', 'comment'].includes(node.type)) {
      ast.topLevelStatements++;
    }

    // Imports
    if (node.type === 'import_statement') {
      ast.imports.push(extractImport(node));
    }

    // Exports
    if (node.type === 'export_statement') {
      ast.exports.push(...extractExports(node, content));
    }

    // Classes
    if (node.type === 'class_declaration') {
      ast.classes.push(extractClass(node, content));
    }

    // Functions
    if (node.type === 'function_declaration' || node.type === 'arrow_function') {
      // Don't double-count methods (handled in class)
      if (node.parent?.type !== 'method_definition' && node.parent?.parent?.type !== 'class_body') {
        // For arrow functions, only extract them if they are part of a variable declaration (top-level or exported)
        if (node.type === 'arrow_function') {
           if (node.parent?.type === 'variable_declarator' && node.parent?.parent?.parent?.type === 'program' || node.parent?.parent?.parent?.type === 'export_statement') {
             ast.functions.push(extractFunction(node, content));
           }
        } else {
          ast.functions.push(extractFunction(node, content));
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
  const sourceNode = node.childForFieldName('source');
  const source = sourceNode ? sourceNode.text.replace(/['"]/g, '') : '';
  
  const specifiers: string[] = [];
  let isDefault = false;
  
  // Look for import clauses
  const importClause = node.children.find(c => c.type === 'import_clause');
  if (importClause) {
    for (const child of importClause.children) {
      if (child.type === 'identifier') {
        isDefault = true;
        specifiers.push(child.text);
      } else if (child.type === 'named_imports') {
        for (const spec of child.children) {
          if (spec.type === 'import_specifier') {
            specifiers.push(spec.text);
          }
        }
      }
    }
  }

  return {
    source,
    specifiers,
    isDefault,
    isDynamic: false,
    line: node.startPosition.row + 1
  };
}

function extractExports(node: SyntaxNode, content: string): ASTExport[] {
  const exports: ASTExport[] = [];
  
  const declaration = node.childForFieldName('declaration');
  if (declaration) {
    if (declaration.type === 'function_declaration') {
      const nameNode = declaration.childForFieldName('name');
      if (nameNode) exports.push({ name: nameNode.text, type: 'function', line: node.startPosition.row + 1 });
    } else if (declaration.type === 'class_declaration') {
      const nameNode = declaration.childForFieldName('name');
      if (nameNode) exports.push({ name: nameNode.text, type: 'class', line: node.startPosition.row + 1 });
    } else if (declaration.type === 'lexical_declaration' || declaration.type === 'variable_declaration') {
      // Find all declarators
      declaration.children.filter(c => c.type === 'variable_declarator').forEach(decl => {
        const nameNode = decl.childForFieldName('name');
        if (nameNode) exports.push({ name: nameNode.text, type: 'variable', line: node.startPosition.row + 1 });
      });
    }
  } else {
    // named exports export { foo, bar }
    const exportClause = node.children.find(c => c.type === 'export_clause');
    if (exportClause) {
      exportClause.children.filter(c => c.type === 'export_specifier').forEach(spec => {
        exports.push({ name: spec.text, type: 're-export', line: node.startPosition.row + 1 });
      });
    }
  }

  return exports;
}

function extractClass(node: SyntaxNode, content: string): ASTClass {
  const nameNode = node.childForFieldName('name');
  const methods: ASTFunction[] = [];
  const properties: string[] = [];
  
  const body = node.childForFieldName('body');
  if (body) {
    for (const child of body.children) {
      if (child.type === 'method_definition') {
        methods.push(extractMethod(child, content));
      } else if (child.type === 'public_field_definition') {
        const propName = child.childForFieldName('name');
        if (propName) properties.push(propName.text);
      }
    }
  }

  // Check if exported
  const isExported = node.parent?.type === 'export_statement';

  return {
    name: nameNode ? nameNode.text : 'AnonymousClass',
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    methods,
    properties,
    isExported
  };
}

function extractFunction(node: SyntaxNode, content: string): ASTFunction {
  let name = 'anonymous';
  let isAsync = false;
  
  if (node.type === 'function_declaration') {
    const nameNode = node.childForFieldName('name');
    if (nameNode) name = nameNode.text;
    
    // Check for async keyword
    isAsync = node.children.some(c => c.type === 'async');
  } else if (node.type === 'arrow_function') {
    // Might be assigned to a variable, let's try to find it
    if (node.parent?.type === 'variable_declarator') {
      const nameNode = node.parent.childForFieldName('name');
      if (nameNode) name = nameNode.text;
    }
    isAsync = node.children.some(c => c.type === 'async');
  }

  const parametersNode = node.childForFieldName('parameters');
  const params: string[] = [];
  if (parametersNode) {
    parametersNode.children.forEach(c => {
      if (c.type === 'identifier' || c.type === 'required_parameter' || c.type === 'optional_parameter') {
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
    isExported: node.parent?.type === 'export_statement' || node.parent?.parent?.type === 'export_statement',
    complexity: calculateComplexity(node)
  };
}

function extractMethod(node: SyntaxNode, content: string): ASTFunction {
  const nameNode = node.childForFieldName('name');
  const name = nameNode ? nameNode.text : 'anonymous';
  const isAsync = node.children.some(c => c.type === 'async');

  const parametersNode = node.childForFieldName('parameters');
  const params: string[] = [];
  if (parametersNode) {
    parametersNode.children.forEach(c => {
      if (c.type === 'identifier' || c.type === 'required_parameter' || c.type === 'optional_parameter') {
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
    if (['if_statement', 'for_statement', 'while_statement', 'catch_clause', 'ternary_expression', '&&', '||'].includes(n.type)) {
      complexity++;
    }
    for (let i = 0; i < n.childCount; i++) {
      walk(n.child(i)!);
    }
  };
  walk(node);
  return complexity;
}
