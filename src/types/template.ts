import type { EmailGoal } from '../lib/constants/emailGoals';
import type { LanguageType } from './language';

export interface Template {
  name: string;
  subject: string;
  content: string;
  language: LanguageType;
  goal: EmailGoal;
  tags: string;
} 