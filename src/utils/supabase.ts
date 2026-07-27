import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://slzmledfrkuffsgmyqxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsem1sZWRmcmt1ZmZzZ215cXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjQ0NzMsImV4cCI6MjA5MzEwMDQ3M30.rIWvQ2XsCECHqNz3iaMiwEdnoLIT7FP3I7jyaHw3H1Q',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
