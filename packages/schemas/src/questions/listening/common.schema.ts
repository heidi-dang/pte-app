import { z } from 'zod';

export const ListeningCommonContractSchema = z.object({
  type: z.string().min(1),
  instructions: z.string().min(1),
  audioProfileId: z.string().optional(),
});
