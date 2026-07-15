import type { ComponentType } from 'react';
import type { QuestionRendererProps } from './types.js';

export type AnyRendererComponent = ComponentType<QuestionRendererProps<unknown, unknown>>;

export interface WebRendererEntry {
  questionType: string;
  component: AnyRendererComponent;
}

/**
 * WebRendererRegistry maps question-type identifiers to React renderer
 * components. This is the browser-side registry — it must NOT import any
 * server-only modules (database, file system, crypto, etc.).
 */
export class WebRendererRegistry {
  private readonly _entries = new Map<string, AnyRendererComponent>();

  /** Register a renderer for the given question type. */
  register(questionType: string, component: AnyRendererComponent): void {
    if (this._entries.has(questionType)) {
      throw new Error(`WebRendererRegistry: duplicate registration for type "${questionType}"`);
    }
    this._entries.set(questionType, component);
  }

  /**
   * Resolve a renderer for the given question type.
   * Returns null if no renderer is registered (caller decides error handling).
   */
  resolve(questionType: string): AnyRendererComponent | null {
    return this._entries.get(questionType) ?? null;
  }

  /** List all registered question types (for debugging / manifests). */
  listRegistered(): string[] {
    return Array.from(this._entries.keys()).sort();
  }

  /** Merge entries from another registry into this one. */
  merge(other: WebRendererRegistry): void {
    for (const [type, component] of other._entries) {
      this.register(type, component);
    }
  }
}

/** Create a new empty registry. */
export function createWebRendererRegistry(): WebRendererRegistry {
  return new WebRendererRegistry();
}
