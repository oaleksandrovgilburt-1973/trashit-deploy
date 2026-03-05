/**
 * Supabase Client Configuration
 * 
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual Supabase project credentials
 * Found in: Supabase Dashboard → Project Settings → API
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
