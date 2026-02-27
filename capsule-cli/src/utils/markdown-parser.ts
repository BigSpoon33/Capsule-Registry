import { readFileSync } from 'fs';

export interface MarkdownLinks {
  wikilinks: string[];       // [[Target]] references
  transclusions: string[];   // ![[Embed]] references
  externalLinks: string[];   // [text](url) references
}

/**
 * Extract wikilinks, transclusions, and external links from Obsidian-flavored Markdown.
 */
export function extractLinks(filePath: string): MarkdownLinks {
  const content = readFileSync(filePath, 'utf-8');

  const wikilinks: string[] = [];
  const transclusions: string[] = [];
  const externalLinks: string[] = [];

  // Transclusions: ![[Something]]
  const transclusionRegex = /!\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = transclusionRegex.exec(content)) !== null) {
    transclusions.push(match[1].split('|')[0].split('#')[0].trim());
  }

  // Wikilinks: [[Something]] (not preceded by !)
  const wikilinkRegex = /(?<!!)\[\[([^\]]+)\]\]/g;
  while ((match = wikilinkRegex.exec(content)) !== null) {
    wikilinks.push(match[1].split('|')[0].split('#')[0].trim());
  }

  // External links: [text](url)
  const externalRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = externalRegex.exec(content)) !== null) {
    externalLinks.push(match[2]);
  }

  return { wikilinks, transclusions, externalLinks };
}

/**
 * Extract quiz questions from a quiz markdown file.
 * Expected format:
 * ## Q1: Question text
 * - [ ] Wrong answer
 * - [x] Correct answer
 * - [ ] Wrong answer
 */
export interface QuizQuestion {
  number: number;
  text: string;
  options: { text: string; correct: boolean }[];
}

export function extractQuizQuestions(filePath: string): QuizQuestion[] {
  const content = readFileSync(filePath, 'utf-8');
  const questions: QuizQuestion[] = [];

  const questionBlocks = content.split(/^## Q(\d+):/m).slice(1);

  for (let i = 0; i < questionBlocks.length; i += 2) {
    const num = parseInt(questionBlocks[i]);
    const block = questionBlocks[i + 1];
    if (!block) continue;

    const lines = block.trim().split('\n');
    const text = lines[0].trim();
    const options: { text: string; correct: boolean }[] = [];

    for (const line of lines.slice(1)) {
      const optMatch = line.match(/^-\s+\[([ x])\]\s+(.+)/);
      if (optMatch) {
        options.push({
          text: optMatch[2].trim(),
          correct: optMatch[1] === 'x',
        });
      }
    }

    questions.push({ number: num, text, options });
  }

  return questions;
}
