import type { CodeFile } from '@code-analyzer/shared';

export type FileType =
  | 'controller'
  | 'service'
  | 'model'
  | 'repository'
  | 'middleware'
  | 'utility'
  | 'config'
  | 'test'
  | 'route'
  | 'unknown';

export function detectFileType(file: CodeFile, content: string = file.content): FileType {
  const pathLower = file.path.toLowerCase();

  // Test files
  if (
    pathLower.includes('.test.') ||
    pathLower.includes('.spec.') ||
    pathLower.includes('__tests__') ||
    pathLower.includes('tests/')
  ) {
    return 'test';
  }

  // Config files
  if (
    pathLower.includes('config') ||
    pathLower.includes('.env') ||
    pathLower.includes('settings') ||
    pathLower.endsWith('.json') ||
    pathLower.endsWith('.yaml') ||
    pathLower.endsWith('.yml')
  ) {
    return 'config';
  }

  // Controllers / Routes
  if (pathLower.includes('controller')) return 'controller';
  if (pathLower.includes('route') || pathLower.includes('router')) return 'route';
  if (content.includes('@Controller') || content.includes('express.Router()') || content.includes('@app.route')) {
    return 'controller'; // or route, but controller is safer for decorators
  }

  // Services
  if (pathLower.includes('service')) return 'service';
  if (content.includes('@Injectable') || content.includes('@Service')) return 'service';

  // Models / Entities
  if (
    pathLower.includes('model') ||
    pathLower.includes('entity') ||
    pathLower.includes('schema') ||
    pathLower.includes('types') ||
    pathLower.includes('interfaces')
  ) {
    return 'model';
  }

  // Repositories / DAOs
  if (pathLower.includes('repository') || pathLower.includes('dao') || content.includes('@Repository')) {
    return 'repository';
  }

  // Middlewares
  if (pathLower.includes('middleware') || pathLower.includes('interceptor')) {
    return 'middleware';
  }

  // Utilities
  if (pathLower.includes('util') || pathLower.includes('helper') || pathLower.includes('common')) {
    return 'utility';
  }

  return 'unknown';
}
