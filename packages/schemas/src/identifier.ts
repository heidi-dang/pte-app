import { z } from 'zod';

const idPattern = /^[a-z]{3}_[a-z0-9]+$/;

export const entityIdSchema = z.string().regex(idPattern, 'Invalid entity id format');
export const userIdSchema = z.string().regex(/^usr_[a-z0-9]+$/, 'Invalid user id format');
export const contentIdSchema = z.string().regex(/^cnt_[a-z0-9]+$/, 'Invalid content id format');
export const attemptIdSchema = z.string().regex(/^att_[a-z0-9]+$/, 'Invalid attempt id format');
export const jobIdSchema = z.string().regex(/^job_[a-z0-9]+$/, 'Invalid job id format');
