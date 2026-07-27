import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://slzmledfrkuffsgmyqxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsem1sZWRmcmt1ZmZzZ215cXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjQ0NzMsImV4cCI6MjA5MzEwMDQ3M30.rIWvQ2XsCECHqNz3iaMiwEdnoLIT7FP3I7jyaHw3H1Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
