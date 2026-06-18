/* ==========================================================================
   Brain — Supabase client bootstrap
   Depends on the supabase-js UMD build (loaded via CDN script tag) and
   window.BRAIN_SUPABASE_URL / window.BRAIN_SUPABASE_ANON_KEY from
   supabase-config.js (copy supabase-config.example.js, see README).
   ========================================================================== */
(function (global) {
  'use strict';

  var configured = !!(global.BRAIN_SUPABASE_URL && global.BRAIN_SUPABASE_ANON_KEY &&
    global.BRAIN_SUPABASE_URL.indexOf('YOUR-PROJECT-REF') === -1);

  var client = null;
  if (configured && global.supabase && global.supabase.createClient) {
    client = global.supabase.createClient(global.BRAIN_SUPABASE_URL, global.BRAIN_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  global.Brain = global.Brain || {};
  global.Brain.Supabase = client;
  global.Brain.isSupabaseConfigured = configured;
})(window);
