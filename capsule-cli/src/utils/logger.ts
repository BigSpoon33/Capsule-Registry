import chalk from 'chalk';

export const log = {
  info: (msg: string) => console.log(chalk.blue('INFO'), msg),
  success: (msg: string) => console.log(chalk.green('PASS'), msg),
  warn: (msg: string) => console.log(chalk.yellow('WARN'), msg),
  error: (msg: string) => console.log(chalk.red('FAIL'), msg),
  heading: (msg: string) => console.log(chalk.bold.cyan(`\n${msg}`)),
  dim: (msg: string) => console.log(chalk.dim(msg)),
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  return {
    valid: results.every(r => r.valid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings),
  };
}
