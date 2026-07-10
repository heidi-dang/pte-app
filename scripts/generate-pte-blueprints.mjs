#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '..');
const manifestPath = resolve(root, 'docs/content/pte-task-manifest.json');
const blueprintPath = resolve(root, 'docs/content/pte-task-blueprints.md');

const SECTIONS = ['Speaking and Writing', 'Reading', 'Listening'];

function sectionLabel(s) {
  if (s === 'Speaking and Writing') return '## Speaking and Writing';
  if (s === 'Reading') return '## Reading';
  if (s === 'Listening') return '## Listening';
  return `## ${s}`;
}

function capitalizeWords(s) {
  return s.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatPromptLength(pl) {
  if (!pl) return 'Not specified';
  if (pl.mode === 'fixed' && pl.minimum === 1 && pl.maximum === 1 && pl.unit === 'image') return '1 image';
  if (pl.mode === 'range' || pl.mode === 'fixed') {
    if (pl.unit === 'words' && pl.minimum === 0) return `Text up to ${pl.maximum} words`;
    if (pl.unit === 'words' && pl.minimum > 0) return `Text ${pl.minimum} to ${pl.maximum} words`;
    if (pl.unit === 'seconds' && pl.minimum === 0) return `Audio up to ${pl.maximum} seconds`;
    if (pl.unit === 'seconds' && pl.minimum > 0) return `Audio ${pl.minimum} to ${pl.maximum} seconds`;
    if (pl.unit === 'sentences') return `Text ${pl.minimum} to ${pl.maximum} sentences`;
    return `${pl.minimum} to ${pl.maximum} ${pl.unit}`;
  }
  return JSON.stringify(pl);
}

function formatScoringType(t) {
  if (t === 'partial-credit') return 'Partial credit';
  if (t === 'correct-incorrect') return 'Correct/Incorrect';
  if (t === 'partial-credit-negative') return 'Partial credit (negative marking)';
  return t;
}

function formatScoringRule(sr) {
  if (!sr) return 'Not specified';
  if (sr.type === 'rubric') {
    return `Rubric (${sr.scoringEngine || 'ai-evaluation'}): ${sr.traits.join(', ')}`;
  }
  if (sr.type === 'per-correct-blank') {
    let s = `Per-correct-blank: +${sr.correctPoints} correct, ${sr.incorrectPoints} incorrect, minimum ${sr.minimumItemScore}`;
    return s;
  }
  if (sr.type === 'per-correct-word') {
    let s = `Per-correct-word: +${sr.correctPoints} correct, ${sr.incorrectPoints} incorrect, minimum ${sr.minimumItemScore}`;
    if (sr.requiresCorrectSpelling) s += ', requires correct spelling';
    return s;
  }
  if (sr.type === 'correct-incorrect') {
    return `Correct/Incorrect: +${sr.correctPoints} correct, ${sr.incorrectPoints} incorrect, minimum ${sr.minimumItemScore}`;
  }
  if (sr.type === 'selection-with-negative-marking') {
    return `Selection with negative marking: +${sr.correctPoints} correct, ${sr.incorrectPoints} incorrect, minimum ${sr.minimumItemScore}`;
  }
  if (sr.type === 'adjacent-pair-order') {
    return `Adjacent pair order: +${sr.correctPoints} correct pair, ${sr.incorrectPoints} incorrect, minimum ${sr.minimumItemScore}`;
  }
  return JSON.stringify(sr);
}

function formatTiming(t, context) {
  if (!t) return 'Not applicable';
  if (context === 'prep') {
    if (t.mode === 'fixed' && t.minimum === 0 && t.maximum === 0) return 'Immediate';
    if (t.mode === 'fixed' && t.minimum === t.maximum && t.minimum > 0) {
      return `${t.minimum} ${t.unit || 'seconds'} preparation`;
    }
    if (t.mode === 'item-dependent') return 'Item-dependent (varies by item)';
    if (t.mode === 'section-timed') return 'Section-level timer';
    return `${t.minimum} to ${t.maximum} ${t.unit || 'seconds'}`;
  }
  if (context === 'resp') {
    if (t.mode === 'fixed' && t.unit === 'seconds') {
      if (t.minimum === 0 && t.maximum === 0) return 'Immediate';
      if (t.minimum === t.maximum) {
        const secs = t.minimum;
        if (secs >= 60 && secs % 60 === 0) return `${secs / 60} minutes`;
        if (secs > 60) return `${Math.floor(secs / 60)} minutes ${secs % 60} seconds`;
        return `${secs} seconds`;
      }
    }
    if (t.mode === 'section-timed') return 'Section-level timer';
    if (t.mode === 'item-dependent') return 'Item-dependent (varies)';
    return `${t.minimum} to ${t.maximum} ${t.unit || 'seconds'}`;
  }
  return JSON.stringify(t);
}

function generateBlueprint(manifest) {
  const lines = [];
  lines.push('# PTE Task Blueprints');
  lines.push('');
  lines.push('Auto-generated from pte-task-manifest.json. Do not edit manually.');
  lines.push('');

  let currentSection = '';
  for (const task of manifest) {
    if (task.section !== currentSection) {
      currentSection = task.section;
      lines.push(sectionLabel(currentSection));
      lines.push('');
    }

    lines.push(`### ${task.displayName}`);
    lines.push('');
    lines.push(`- **Canonical ID**: ${task.canonicalId}`);
    lines.push(`- **Current official status**: ${task.currentOfficialTask ? 'Current official task' : 'Not current official task'}`);
    lines.push(`- **Section**: ${task.section}`);
    lines.push(`- **Official skills assessed**: ${(task.officialSkillsAssessed || []).join(', ')}`);
    lines.push(`- **Score contributions**: ${(task.scoreContributions || []).join(', ')}`);
    lines.push(`- **Prompt type**: ${capitalizeWords(task.promptType || '')}`);
    lines.push(`- **Prompt length**: ${formatPromptLength(task.promptLength)}`);
    lines.push(`- **Preparation behaviour**: ${formatTiming(task.preparationTiming, 'prep')}`);

    // Response behaviour: use responseTimingDescription if present
    const respDesc = task.responseTimingDescription || formatTiming(task.responseTiming, 'resp');
    lines.push(`- **Response behaviour**: ${respDesc}`);

    lines.push(`- **Playback limit**: ${task.playbackLimit === 0 ? 'No audio' : String(task.playbackLimit)}`);
    lines.push(`- **Recording limit**: ${task.recordingLimit === 0 ? 'No audio' : String(task.recordingLimit)}`);
    lines.push(`- **Official scoring type**: ${formatScoringType(task.officialScoringType)}`);
    lines.push(`- **Official scoring rule**: ${formatScoringRule(task.scoringRule)}`);

    const rubricTraits = (task.officialRubricTraits || []);
    if (rubricTraits.length === 0) {
      lines.push('- **Official rubric traits**: None — objective scoring');
    } else {
      lines.push(`- **Official rubric traits**: ${rubricTraits.join(', ')}`);
    }

    lines.push(`- **Prompt transcript requirement**: ${task.promptTranscriptRequired ? 'Required' : 'Not required'}`);
    lines.push(`- **Post-attempt transcript availability**: ${task.postAttemptTranscriptAvailable ? 'Available' : 'Not available'}`);
    lines.push(`- **Practice mode**: ${task.practiceMode || 'Not specified'}`);
    lines.push(`- **Mock mode**: ${task.mockMode || 'Not specified'}`);
    lines.push(`- **Official reference IDs**: ${(task.referenceIds || []).join(', ')}`);
    lines.push(`- **Last verified date**: ${task.lastVerifiedAt || 'Not verified'}`);
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  if (!existsSync(manifestPath)) {
    console.error('Manifest not found:', manifestPath);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const generated = generateBlueprint(manifest);

  const isValidate = process.argv.includes('--validate');

  if (isValidate) {
    if (!existsSync(blueprintPath)) {
      console.log('docs/content/pte-task-blueprints.md is not synchronized with the manifest. Run npm run generate:pte-blueprints.');
      process.exit(1);
    }
    const current = readFileSync(blueprintPath, 'utf-8');
    if (generated !== current) {
      console.log('docs/content/pte-task-blueprints.md is not synchronized with the manifest. Run npm run generate:pte-blueprints.');
      process.exit(1);
    }
    process.exit(0);
  } else {
    writeFileSync(blueprintPath, generated, 'utf-8');
    console.log('Generated docs/content/pte-task-blueprints.md');
  }
}

main();
