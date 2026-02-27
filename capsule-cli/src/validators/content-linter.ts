import { readFileSync } from 'fs';
import { join } from 'path';
import { extractQuizQuestions } from '../utils/markdown-parser';
import type { ValidationResult } from '../utils/logger';
import type { CapsuleData } from '../utils/yaml-loader';

/**
 * Lint content files for structural correctness.
 * - Quiz files must have properly formatted questions with at least one correct answer
 * - Lesson files should have headings
 * - Lab files should have objectives and steps
 */
export function lintContent(data: CapsuleData, capsuleDir: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const modules = data.content_modules as any[] | undefined;
  if (!modules) return { valid: true, errors, warnings };

  for (const mod of modules) {
    if (!mod.path) continue;
    const fullPath = join(capsuleDir, mod.path);

    try {
      const content = readFileSync(fullPath, 'utf-8');

      switch (mod.type) {
        case 'quiz':
          lintQuiz(mod, fullPath, content, errors, warnings);
          break;
        case 'lesson':
          lintLesson(mod, content, errors, warnings);
          break;
        case 'lab':
          lintLab(mod, content, errors, warnings);
          break;
      }
    } catch {
      // File missing errors handled by structure-checker
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function lintQuiz(
  mod: any,
  filePath: string,
  content: string,
  errors: string[],
  warnings: string[],
) {
  const questions = extractQuizQuestions(filePath);

  if (questions.length === 0) {
    errors.push(`Quiz "${mod.id}": No questions found (expected ## Q1: format)`);
    return;
  }

  for (const q of questions) {
    if (q.options.length < 2) {
      errors.push(`Quiz "${mod.id}" Q${q.number}: Must have at least 2 options`);
    }
    const correctCount = q.options.filter(o => o.correct).length;
    if (correctCount === 0) {
      errors.push(`Quiz "${mod.id}" Q${q.number}: No correct answer marked [x]`);
    }
    if (correctCount > 1) {
      warnings.push(`Quiz "${mod.id}" Q${q.number}: Multiple correct answers — is this intentional?`);
    }
  }

  if (questions.length < 3) {
    warnings.push(`Quiz "${mod.id}": Only ${questions.length} questions — consider adding more`);
  }
}

function lintLesson(mod: any, content: string, errors: string[], warnings: string[]) {
  const headings = content.match(/^#{1,3}\s+.+/gm);
  if (!headings || headings.length === 0) {
    warnings.push(`Lesson "${mod.id}": No headings found — content may lack structure`);
  }

  if (content.trim().length < 200) {
    warnings.push(`Lesson "${mod.id}": Very short content (${content.trim().length} chars)`);
  }
}

function lintLab(mod: any, content: string, errors: string[], warnings: string[]) {
  const hasObjective = /objective|goal|overview/i.test(content);
  const hasSteps = /step\s+\d|task\s+\d|##\s+\d/i.test(content) || /^-\s+\[/m.test(content);

  if (!hasObjective) {
    warnings.push(`Lab "${mod.id}": No objective/goal section found`);
  }
  if (!hasSteps) {
    warnings.push(`Lab "${mod.id}": No numbered steps or task checklist found`);
  }
}
