'use server';
/**
 * @fileOverview A flow to get salary benchmark data for a job role.
 *
 * - getSalaryBenchmark - Fetches salary benchmark data.
 * - GetSalaryBenchmarkInput - The input type.
 * - GetSalaryBenchmarkOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import { GetSalaryBenchmarkInputSchema, GetSalaryBenchmarkOutputSchema } from '@/lib/types';
import {z} from 'zod';

export type GetSalaryBenchmarkInput = z.infer<typeof GetSalaryBenchmarkInputSchema>;
export type GetSalaryBenchmarkOutput = z.infer<typeof GetSalaryBenchmarkOutputSchema>;

export async function getSalaryBenchmark(
  input: GetSalaryBenchmarkInput
): Promise<GetSalaryBenchmarkOutput> {
  return getSalaryBenchmarkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getSalaryBenchmarkPrompt',
  input: {schema: GetSalaryBenchmarkInputSchema},
  output: {schema: GetSalaryBenchmarkOutputSchema},
  prompt: `You are a salary and compensation analyst.

Provide an estimated salary range for the job role "{{jobRole}}" in "{{location}}".
Also provide a brief commentary on the market conditions for this role in that location.

Present the salary in the local currency format (e.g., LPA for India).
Base your answer on your general knowledge of compensation data.
`,
});

const getSalaryBenchmarkFlow = ai.defineFlow(
  {
    name: 'getSalaryBenchmarkFlow',
    inputSchema: GetSalaryBenchmarkInputSchema,
    outputSchema: GetSalaryBenchmarkOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
