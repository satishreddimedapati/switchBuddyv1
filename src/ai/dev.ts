
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
import '@/ai/flows/get-company-insights.ts';
import '@/ai/flows/get-salary-benchmark.ts';
import '@/ai/flows/get-market-intelligence.ts';
import '@/ai/flows/get-personalized-salary-estimate.ts';
import '@/ai/flows/generate-recruiter-message.ts';
import '@/ai/flows/generate-interview-plan.ts';
import '@/ai/flows/send-daily-debrief.ts';
import '@/ai/flows/generate-task-description.ts';
import '@/ai/flows/generate-learning-roadmap.ts';
import '@/ai/flows/generate-roadmap-suggestions.ts';
import '@/ai/flows/generate-topic-history.ts';
import '@/ai/flows/generate-channel-suggestions.ts';
import '@/ai/flows/generate-chat-lesson.ts';
