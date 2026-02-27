import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import type { ValidationResult } from '../utils/logger';
import type { CapsuleData } from '../utils/yaml-loader';

const SCHEMA_DIR = join(dirname(dirname(__dirname)), 'schemas');

export function validateSchema(data: CapsuleData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const schemaPath = join(SCHEMA_DIR, 'learning-capsule.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid && validate.errors) {
      for (const err of validate.errors) {
        const path = err.instancePath || '(root)';
        errors.push(`${path}: ${err.message} ${err.params ? JSON.stringify(err.params) : ''}`);
      }
    }

    // Additional semantic checks
    if (data.content_modules && Array.isArray(data.content_modules)) {
      const ids = new Set<string>();
      for (const mod of data.content_modules as any[]) {
        if (ids.has(mod.id)) {
          errors.push(`Duplicate module ID: "${mod.id}"`);
        }
        ids.add(mod.id);
      }

      // Check pass_criteria references exist
      const passCriteria = data.pass_criteria as any;
      if (passCriteria) {
        for (const labId of passCriteria.required_labs || []) {
          if (!ids.has(labId)) {
            errors.push(`pass_criteria.required_labs references unknown module: "${labId}"`);
          }
        }
        for (const quizId of passCriteria.required_quizzes || []) {
          if (!ids.has(quizId)) {
            errors.push(`pass_criteria.required_quizzes references unknown module: "${quizId}"`);
          }
        }
      }

      // Check module prerequisites reference existing modules
      for (const mod of data.content_modules as any[]) {
        for (const prereq of mod.prerequisites || []) {
          if (!ids.has(prereq)) {
            errors.push(`Module "${mod.id}" prerequisite references unknown module: "${prereq}"`);
          }
        }
      }
    }

    // Warnings
    if (!data.estimated_hours) {
      warnings.push('Missing estimated_hours — recommended for student planning');
    }
    if (!data.tags || (data.tags as any[]).length === 0) {
      warnings.push('No tags defined — helps with discoverability');
    }
    if (!data.icon) {
      warnings.push('No icon defined — helps with visual identification');
    }

  } catch (err: any) {
    errors.push(`Schema validation error: ${err.message}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
