const $ = id => document.getElementById(id);

export function initCustomerAuth() {
    let activeTab = 'login';

    const getToken = () => localStorage.getItem('customer_token');
    const getUsername = () => localStorage.getItem('customer_username');
    const header = () => { const t = getToken(); return t ? { Authorization: t } : {}; };

    function save(token, username) {
        localStorage.setItem('customer_token', token);
        localStorage.setItem('customer_username', username);
    }

    function clear() {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_username');
    }

    function updateUI() {
        const name = getUsername();

        $('auth-btn').textContent = name || 'Увійти';
        $('auth-btn').classList.add('logged-in');
    }

    function showModal() {
        $('auth-modal').classList.remove('hidden');
        $('auth-username').focus();
    }

    function hideModal() {
        $('auth-modal').classList.add('hidden');
        $('auth-error').textContent = '';
        $('auth-username').value = '';
        $('auth-password').value = '';
    }

    function closeModal() { onGranted = null; hideModal(); }

    function setTab(tab) {
        activeTab = tab;
        document.querySelectorAll('.auth-tab').forEach(b =>
            b.classList.toggle('active', b.dataset.tab = tab)
        );
        $('auth-submit').textContent = tab === 'login' ? 'Увійти' : 'Зареєструватись';
        $('auth-error').textContent = '';
    }

    async function submit() {
        const username = $('auth-username').value.trim();
        const password = $('auth-password').value;
        if (!username || !password) { $('auth-error').textContent = 'заповніть всі поля'; return; }

        const url = activeTab === 'login' ? '/auth/login' : '/auth/register';
        try {
            const res = await fetch(url, {
                method: 'POST',
                body: {
                    username,
                    password
                }
            });

            const data = res.json();

            if (!res.ok) {
                $('auth-error').textContent = data.error ?? 'помилка';
                return;
            }

            alert('увійшли!');
            hideModal();
        } catch {
            $('auth-error').textContent = "помилка з'єднання";
        }
    }

    

    document.querySelectorAll('.auth-tab').forEach(b =>
        b.addEventListener('click', () => setTab(b.dataset.tab))
    );
    $('auth-close').addEventListener('click', closeModal);
    $('auth-modal').addEventListener('click', e => { if (e.target === $('auth-modal')) closeModal(); });
    $('auth-submit').addEventListener('click', submit);
    $('auth-password').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    $('auth-btn').addEventListener('click', () => {
        if (getToken()) { clear(); updateUI(); } else showModal();
    });

    return {
        getToken,
        header,
        updateUI,

        requireAuth(cb) {
            if (!getToken()) {
                cb();
                return;
            }

            onGranted = cb;

            showModal();
        }
    };
}

//----------------------------------------------------------------------
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
