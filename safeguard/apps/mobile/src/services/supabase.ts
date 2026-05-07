import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fffrstfabeacsmevpqjn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZnJzdGZhYmVhY3NtZXZwcWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjY4ODMsImV4cCI6MjA5Mzc0Mjg4M30.KubS5wmpfpyvbThAEfQhKGnbOff0z_l33Vw6_8emMAo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
