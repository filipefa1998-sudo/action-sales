// ══════════════════════════════════════════════════════════════════
//  ACTION PLUMBING — Shared Auth System
//  auth.js  ·  include AFTER firebase init, BEFORE page scripts
// ══════════════════════════════════════════════════════════════════

const AP_AUTH = (function () {

    const SESSION_KEY   = 'ap_session';
    const TIMEOUT_MS    = 30 * 60 * 1000;   // 30 minutes
    const MANAGER_KEY   = 'ap_mgr_unlocked';
    let _timer          = null;
    let _activityBound  = false;
    let _onLoginCb      = null;

    // ── helpers ─────────────────────────────────────────────────────
    function _saveSession(session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    function _getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
    }
    function _clearSession() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('selectedPerson');
    }

    // ── activity timer ───────────────────────────────────────────────
    function _resetTimer() {
        clearTimeout(_timer);
        _timer = setTimeout(_autoLogout, TIMEOUT_MS);
        const s = _getSession();
        if (s) { s.lastActivity = Date.now(); _saveSession(s); }
    }
    function _bindActivity() {
        if (_activityBound) return;
        _activityBound = true;
        ['mousemove','keydown','click','touchstart','scroll'].forEach(e =>
            document.addEventListener(e, _resetTimer, { passive: true })
        );
    }
    function _autoLogout() {
        _clearSession();
        _showLogoutBanner('Session expired after 30 minutes of inactivity.');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    }

    // ── logout banner (shows briefly before redirect) ────────────────
    function _showLogoutBanner(msg) {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:99999;
            background:#dc2626;color:#fff;font-family:'Oswald',sans-serif;
            font-size:13px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;
            padding:14px 20px;text-align:center`;
        el.textContent = msg || 'Logged out';
        document.body.appendChild(el);
    }

    // ── PUBLIC API ───────────────────────────────────────────────────
    return {

        // Call once after Firebase db is available, passing in the db ref.
        // pageName: 'tech' | 'manager' — manager skips login gate (uses PIN)
        init(db, pageName, onLoginSuccess) {
            _onLoginCb = onLoginSuccess;

            if (pageName === 'manager') {
                // Manager page keeps its own PIN gate – just set up auto-logout
                const s = _getSession();
                if (s) { _bindActivity(); _resetTimer(); }
                return;
            }

            // Check existing session
            const s = _getSession();
            if (s && s.personId) {
                // Verify still within timeout
                if (Date.now() - (s.lastActivity || 0) < TIMEOUT_MS) {
                    _bindActivity();
                    _resetTimer();
                    if (_onLoginCb) _onLoginCb(s);
                    return;
                } else {
                    _clearSession();
                }
            }

            // Build and show login screen
            AP_AUTH.showLoginScreen(db);
        },

        // Show full-page login screen, resolves via onLoginSuccess callback
        showLoginScreen(db) {
            // Inject login overlay
            const overlay = document.createElement('div');
            overlay.id = 'ap-login-overlay';
            overlay.style.cssText = `position:fixed;inset:0;z-index:99998;
                background:var(--bg,#080808);display:flex;align-items:center;justify-content:center;`;
            overlay.innerHTML = `
                <div style="background:var(--s1,#111);border:1px solid rgba(255,255,255,0.06);
                    border-top:3px solid #dc2626;padding:52px 44px;width:100%;max-width:400px;text-align:center;">
                    <div style="font-size:36px;margin-bottom:16px">🔑</div>
                    <div style="font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:3px;color:var(--text,#efefef);margin-bottom:4px">Sign In</div>
                    <div style="font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#666;margin-bottom:32px">Action Plumbing Tracker</div>

                    <input id="ap-login-user" type="text" autocomplete="username"
                        placeholder="Username"
                        style="width:100%;background:var(--s3,#202020);border:1px solid rgba(255,255,255,0.10);
                        color:var(--text,#efefef);padding:13px 14px;font-family:'Inter',sans-serif;
                        font-size:14px;outline:none;margin-bottom:10px;transition:border-color .15s;display:block" />
                    <input id="ap-login-pass" type="password" autocomplete="current-password"
                        placeholder="Password"
                        style="width:100%;background:var(--s3,#202020);border:1px solid rgba(255,255,255,0.10);
                        color:var(--text,#efefef);padding:13px 14px;font-family:'Inter',sans-serif;
                        font-size:14px;outline:none;margin-bottom:14px;transition:border-color .15s;display:block" />
                    <p id="ap-login-err" style="font-size:12px;color:#ef4444;font-family:'Oswald',sans-serif;
                        letter-spacing:.08em;margin-bottom:10px;min-height:18px"></p>
                    <button id="ap-login-btn"
                        style="width:100%;background:#dc2626;color:#fff;font-family:'Oswald',sans-serif;
                        font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
                        padding:14px;border:none;cursor:pointer;transition:background .15s;margin-bottom:20px">
                        UNLOCK
                    </button>
                    <a href="index.html" style="font-size:12px;color:#666;text-decoration:none;
                        font-family:'Oswald',sans-serif;letter-spacing:.08em;text-transform:uppercase">
                        ← Back to dashboard
                    </a>
                </div>`;
            document.body.appendChild(overlay);

            // Focus & key handler
            const userIn = overlay.querySelector('#ap-login-user');
            const passIn = overlay.querySelector('#ap-login-pass');
            const errEl  = overlay.querySelector('#ap-login-err');
            const btn    = overlay.querySelector('#ap-login-btn');
            setTimeout(() => userIn.focus(), 80);

            // Focus styles
            [userIn, passIn].forEach(el => {
                el.addEventListener('focus',  () => el.style.borderColor = '#dc2626');
                el.addEventListener('blur',   () => el.style.borderColor = 'rgba(255,255,255,0.10)');
            });

            const doLogin = () => {
                const user = userIn.value.trim().toLowerCase();
                const pass = passIn.value;
                errEl.textContent = '';
                if (!user || !pass) { errEl.textContent = 'Enter username and password'; return; }

                btn.textContent = 'CHECKING…';
                btn.disabled = true;

                db.ref('techLogins').once('value', snap => {
                    const logins = snap.val() || {};
                    let matched = null;
                    Object.entries(logins).forEach(([id, rec]) => {
                        if (rec.username && rec.username.toLowerCase() === user && rec.password === pass) {
                            matched = { personId: id, name: rec.name || rec.username, username: rec.username };
                        }
                    });

                    if (matched) {
                        const session = { ...matched, lastActivity: Date.now() };
                        _saveSession(session);
                        localStorage.setItem('selectedPerson', matched.personId);
                        overlay.remove();
                        _bindActivity();
                        _resetTimer();
                        if (_onLoginCb) _onLoginCb(session);
                    } else {
                        errEl.textContent = 'Incorrect username or password';
                        btn.textContent = 'UNLOCK';
                        btn.disabled = false;
                        passIn.value = '';
                        passIn.focus();
                    }
                });
            };

            btn.onclick = doLogin;
            [userIn, passIn].forEach(el => el.addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); }));
        },

        // Get current logged-in session (or null)
        getSession() { return _getSession(); },

        // Logout current tech
        logout(redirectTo) {
            clearTimeout(_timer);
            _clearSession();
            _showLogoutBanner('Logged out.');
            setTimeout(() => { window.location.href = redirectTo || 'index.html'; }, 800);
        },

        // Extend session on any action
        touch() { _resetTimer(); },

        // Used by manager to set the selected person so other pages still work
        setSelectedPerson(id) {
            localStorage.setItem('selectedPerson', id);
            const s = _getSession();
            if (s) { s.personId = id; _saveSession(s); }
        }
    };
})();
