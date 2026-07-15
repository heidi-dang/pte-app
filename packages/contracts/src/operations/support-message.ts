export interface SupportMessage {
  id: string;
  caseId: string;
  authorId: string;
  authorType: 'student' | 'agent' | 'system';
  body: string;
  visibility: 'public' | 'private';
  attachmentIds: string[];
  mediaReferences: string[];
  createdAt: string;
}
