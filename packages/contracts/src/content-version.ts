/**
 * Content-version interface.
 *
 * Every published content item carries a version and provenance.
 */

export interface ContentVersion {
  readonly contentId: string;
  readonly version: number;
  readonly status: 'draft' | 'review' | 'approved' | 'published' | 'retired';
  readonly publishedAt?: string;
  readonly sourceId?: string;
  readonly provenance?: ContentProvenance;
}

export interface ContentProvenance {
  readonly author: string;
  readonly source: 'original' | 'licensed' | 'generated' | 'imported';
  readonly licenceRef?: string;
  readonly attribution?: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
}
