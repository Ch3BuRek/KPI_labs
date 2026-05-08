const $ = id => document.getElementById(id);

export function initManagerAuth({ onLogin }) {
    const getToken = () => localStorage.getItem('admin_token');
    const header   = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

    function showLogin(msg = '') {
        $('login-overlay').classList.remove('hidden');
        $('login-error').textContent = msg;
    }

    function hideLogin() { $('login-overlay').classList.add('hidden'); }

    async function tryLogin() {
        const username = $('login-username').value.trim();
        const password = $('login-password').value;
        try {
            const res = await fetch('/auth/login', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ username, password }),
            });
            if (!res.ok) { showLogin('Invalid credentials'); return; }
            const { token } = await res.json();
            localStorage.setItem('admin_token', token);
            hideLogin();
            onLogin();
        } catch {
            showLogin('Login failed');
        }
    }

    $('login-btn').addEventListener('click', tryLogin);
    $('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

    return { getToken, header, showLogin };
}
