parentPasswordLogin = async function () {
  const id = $('parentIdentifier')?.value?.trim() || '';
  const password = $('parentPassword')?.value || '';
  const host = $('parentGate');

  if (!id || !password) {
    v75AuthStatus(host, 'Mobile/Email और Password डालें');
    return;
  }

  v75AuthStatus(host, 'Login check किया जा रहा है...', true);

  try {
    const r = await fetch('/api/parent-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: id, password })
    });

    const j = await r.json();

    if (!r.ok) {
      throw new Error(j?.error || 'Parent login failed');
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
      'Parent login failed: ' + (e?.message || 'Login failed')
    );
  }
};
