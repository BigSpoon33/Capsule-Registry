import { existsSync } from 'fs';
import { join } from 'path';
import type { ValidationResult } from '../utils/logger';
import type { CapsuleData } from '../utils/yaml-loader';

/**
 * Verify all content_modules[].path files exist on disk.
 */
export function checkStructure(data: CapsuleData, capsuleDir: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const modules = data.content_modules as any[] | undefined;
  if (!modules || !Array.isArray(modules)) {
    errors.push('No content_modules array found');
    return { valid: false, errors, warnings };
  }

  for (const mod of modules) {
    if (!mod.path) {
      errors.push(`Module "${mod.id}" has no path`);
      continue;
    }

    const fullPath = join(capsuleDir, mod.path);
    if (!existsSync(fullPath)) {
      errors.push(`Module "${mod.id}" path not found: ${mod.path}`);
    }
  }

  // Check for README
  if (!existsSync(join(capsuleDir, 'README.md'))) {
    warnings.push('No README.md found — recommended for capsule documentation');
  }

  // Check for orphan content files (files not referenced by any module)
  const referencedPaths = new Set(modules.map((m: any) => m.path));
  const contentDirs = ['lessons', 'labs', 'quizzes'];

  for (const dir of contentDirs) {
    const dirPath = join(capsuleDir, dir);
    if (!existsSync(dirPath)) continue;

    try {
      const files = require('fs').readdirSync(dirPath) as string[];
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const relativePath = `${dir}/${file}`;
        if (!referencedPaths.has(relativePath)) {
          warnings.push(`Orphan file not referenced by any module: ${relativePath}`);
        }
      }
    } catch {
      // Skip unreadable dirs
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
