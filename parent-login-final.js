parentPasswordLogin = async function () {
  const id = $('parentIdentifier')?.value?.trim() || '';
  const password = $('parentPassword')?.value || '';
  const host = $('parentGate');

  if (!id || !password) {
    v75AuthStatus(host, 'v75ParentLoginStatus', 'Mobile/Email और Password डालें', false);
    return;
  }

  v75AuthStatus(host, 'v75ParentLoginStatus', 'Login check किया जा रहा है...', true);

  try {
    const r = await fetch('/api/parent-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: id, password })
    });

    const raw = await r.text();
    let j = {};

    try {
      j = raw ? JSON.parse(raw) : {};
    } catch (_) {
      j = { error: raw || 'Server returned an invalid response' };
    }

    if (!r.ok) {
      throw new Error(j?.error || ('Server error ' + r.status));
    }

    if (!j?.access_token || !j?.refresh_token) {
      throw new Error(
        j?.error || 'Parent account अभी Admin द्वारा activate नहीं किया गया है'
      );
    }

    const { data, error } = await sb.auth.setSession({
      access_token: j.access_token,
      refresh_token: j.refresh_token
    });

    if (error) throw error;

    user = data.user;
    await loadProfile();

    if (!['parent', 'student'].includes(profile?.role)) {
      await sb.auth.signOut();
      throw new Error('यह Parent/Student account नहीं है');
    }

    parentVerifiedEmail = String(user?.email || '').toLowerCase();

    $('parentGate')?.classList.add('hidden');
    $('parentDashboard')?.classList.remove('hidden');

    await loadParentPortal();

  } catch (e) {
    v75AuthStatus(
      host,
      'v75ParentLoginStatus',
      'Parent login failed: ' + (e?.message || 'Login failed'),
      false
    );
  }
};
