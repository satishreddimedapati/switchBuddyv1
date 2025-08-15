'use server';

/**
 * @fileoverview This is the entrypoint for all Genkit flows.
 *
 * This file is automatically loaded by the Genkit CLI.
 */

import {config} from 'dotenv';
config();

import '@/ai/flows/tailor-resume.ts';
import '@/ai/flows/generate-interview-questions.ts';
import '@/ai/flows/schedule-optimizer.ts';
import '@/ai/flows/interview-topic-scheduler.ts';
import '@/ai/flows/interview-practice.ts';
