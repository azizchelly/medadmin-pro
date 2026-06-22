

const SUPABASE_URL = 'https://esdzbjnlkyqvnuzyyooj.supabase.co';       // ex: https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZHpiam5sa3lxdm51enl5b29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTYwMjEsImV4cCI6MjA5NzY5MjAyMX0.AIYNqfrddwS5kPcROwQBNAQmQ0EBZ7lChyYQGLuq1ZE';      // clé "anon public"

// Initialisation du client Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
