import nextEnv from '@next/env';
import { mkdir, writeFile } from 'node:fs/promises';
nextEnv.loadEnvConfig(process.cwd());
const { renderSupabaseAuthTemplate } = await import('../src/lib/email/templates');
await mkdir('supabase/templates', { recursive: true });
for (const type of ['confirmation', 'recovery'] as const)
  await writeFile(`supabase/templates/${type}.html`, renderSupabaseAuthTemplate(type));
console.log('Supabase Auth templates generated from the central brand configuration.');
