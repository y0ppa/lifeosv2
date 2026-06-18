/* ==========================================================================
   Brain — Authentication
   Thin wrapper around Supabase Auth: sign up, sign in, sign out, session
   restoration, and the password-reset flow. The same Supabase project (and
   therefore the same account) is shared between this web app and the
   future mobile app — there is nothing web-specific about the accounts
   themselves, only about how the session is stored (browser storage here,
   secure device storage on mobile).
   ========================================================================== */
(function (global) {
  'use strict';

  var PUBLIC_PAGES = ['login', 'reset-password'];

  function client() {
    return global.Brain && global.Brain.Supabase;
  }

  function signUp(email, password) {
    if (!client()) return Promise.reject(new Error('Supabase is not configured. See apps/web/assets/js/supabase-config.example.js.'));
    return client().auth.signUp({ email: email, password: password });
  }

  function signIn(email, password) {
    if (!client()) return Promise.reject(new Error('Supabase is not configured. See apps/web/assets/js/supabase-config.example.js.'));
    return client().auth.signInWithPassword({ email: email, password: password });
  }

  function signOut() {
    if (!client()) return Promise.resolve();
    return client().auth.signOut();
  }

  function getSession() {
    if (!client()) return Promise.resolve(null);
    return client().auth.getSession().then(function (res) {
      return (res.data && res.data.session) || null;
    });
  }

  function getUser() {
    if (!client()) return Promise.resolve(null);
    return client().auth.getUser().then(function (res) {
      return (res.data && res.data.user) || null;
    });
  }

  function requestPasswordReset(email) {
    if (!client()) return Promise.reject(new Error('Supabase is not configured.'));
    var redirectTo = global.location.origin + global.location.pathname.replace(/[^/]*$/, '') + 'reset-password.html';
    return client().auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
  }

  function updatePassword(newPassword) {
    if (!client()) return Promise.reject(new Error('Supabase is not configured.'));
    return client().auth.updateUser({ password: newPassword });
  }

  function onAuthStateChange(callback) {
    if (!client()) return { unsubscribe: function () {} };
    var sub = client().auth.onAuthStateChange(function (event, session) {
      callback(event, session);
    });
    return sub.data.subscription;
  }

  /**
   * Call at the top of every page's init. Redirects to login.html if there's
   * no session and the current page isn't itself a public auth page.
   * Returns the session (or null on public pages) so callers can branch.
   */
  function guardPage(currentPage) {
    if (PUBLIC_PAGES.indexOf(currentPage) !== -1) return Promise.resolve(null);
    if (!client()) return Promise.resolve(null); // not configured yet — let the app run in local demo mode
    return getSession().then(function (session) {
      if (!session) {
        global.location.replace('login.html');
        return null;
      }
      return session;
    });
  }

  global.Brain = global.Brain || {};
  global.Brain.Auth = {
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    getUser: getUser,
    requestPasswordReset: requestPasswordReset,
    updatePassword: updatePassword,
    onAuthStateChange: onAuthStateChange,
    guardPage: guardPage,
    PUBLIC_PAGES: PUBLIC_PAGES
  };
})(window);
