import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { log, mergeResults, type ValidationResult } from '../utils/logger';
import { loadCapsuleYaml } from '../utils/yaml-loader';
import { validateSchema } from '../validators/schema-validator';
import { checkStructure } from '../validators/structure-checker';
import { checkLinks } from '../validators/link-checker';
import { lintContent } from '../validators/content-linter';

export async function validate(path: string) {
  const capsuleDir = resolve(path);
  log.heading(`Validating capsule: ${capsuleDir}`);

  // Locate capsule.yaml
  const yamlPath = join(capsuleDir, 'capsule.yaml');
  if (!existsSync(yamlPath)) {
    log.error(`capsule.yaml not found in ${capsuleDir}`);
    process.exit(1);
  }

  // Load YAML
  let data;
  try {
    data = loadCapsuleYaml(yamlPath);
    log.success('capsule.yaml loaded');
  } catch (err: any) {
    log.error(`Failed to parse capsule.yaml: ${err.message}`);
    process.exit(1);
  }

  // Run all validators
  const results: { name: string; result: ValidationResult }[] = [
    { name: 'Schema Validation', result: validateSchema(data) },
    { name: 'Structure Check', result: checkStructure(data, capsuleDir) },
    { name: 'Link Check', result: checkLinks(capsuleDir) },
    { name: 'Content Lint', result: lintContent(data, capsuleDir) },
  ];

  // Report results
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const { name, result } of results) {
    log.heading(name);

    if (result.valid) {
      log.success(`${name}: All checks passed`);
    }

    for (const err of result.errors) {
      log.error(err);
      totalErrors++;
    }
    for (const warn of result.warnings) {
      log.warn(warn);
      totalWarnings++;
    }
  }

  // Summary
  log.heading('Summary');
  if (totalErrors === 0) {
    log.success(`Capsule is valid! (${totalWarnings} warnings)`);
  } else {
    log.error(`${totalErrors} errors, ${totalWarnings} warnings`);
    process.exit(1);
  }
}
