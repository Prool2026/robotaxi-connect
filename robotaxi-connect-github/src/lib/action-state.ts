import type { MessageKey } from '@/i18n/messages';
export type ActionState = {
  ok?: boolean;
  error?: MessageKey;
  message?: MessageKey;
  fields?: string[];
};
export const initialState: ActionState = {};
