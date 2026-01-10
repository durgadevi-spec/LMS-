(async () => {
  try {
    const code = process.argv[2] || 'TEST_NEW_1';
    const password = process.argv[3] || 'test';
    const SUPA = 'https://gykfyiqujyiwchqgmsjx.supabase.co';
    const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a2Z5aXF1anlpd2NocWdtc2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODU4MzcsImV4cCI6MjA4MzM2MTgzN30.x_kTc_EUfq2Y3cldzLwdHM0M7jcYIzAr37TRjsx3fqY';
    const headers = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

    const normalized = code.toString().trim();
    console.log('Login simulation for', normalized);

    // Check existing
    let res = await fetch(`${SUPA}/rest/v1/users?select=*&username=eq.${encodeURIComponent(normalized)}&limit=1`, { headers });
    console.log('Select status', res.status, await res.text());

    // If not found, insert minimal row
    res = await fetch(`${SUPA}/rest/v1/users?select=*&username=eq.${encodeURIComponent(normalized)}&limit=1`, { headers });
    const text = await res.text();
    if (text === '[]') {
      console.log('User not found — inserting minimal row');
      const payload = { user_id: normalized, username: normalized, role: 'employee', password };
      const ins = await fetch(`${SUPA}/rest/v1/users`, { method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(payload) });
      console.log('Insert status', ins.status);
      console.log(await ins.text());
    } else {
      console.log('User already exists');
    }
  } catch (err) {
    console.error('Test error', err);
    process.exitCode = 2;
  }
})();
