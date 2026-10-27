/* Admin-only account creation. Authorization is enforced by api.php. */
(function () {
  'use strict';
  const O = window.OME;
  const esc = O.esc;
  const categoryNames = { ome_staff: 'OME staff', faculty: 'Faculty', staff: 'Staff', student: 'Student' };

  async function api(action, method = 'GET', data) {
    const response = await fetch('/api.php?action=' + action, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: data ? { 'Content-Type': 'application/json' } : {},
      body: data ? JSON.stringify(data) : undefined
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'The request failed');
    return result;
  }

  async function render(root) {
    root.innerHTML = '<div class="card" role="status">Loading users…</div>';
    let users;
    try { ({ users } = await api('users')); }
    catch (error) { root.innerHTML = `<div class="card"><h2>Users unavailable</h2><p>${esc(error.message)}</p></div>`; return; }
    if (!root.isConnected) return;
    root.innerHTML = `<section class="users-page">
      <div class="section-head"><div><h1>Users</h1><p class="muted">Create individual accounts for OME staff, faculty, staff, and students.</p></div></div>
      <div class="card users-layout"><div><h2>Add a user</h2><p class="muted small">Only OME staff admins can create accounts. Share the temporary password privately and ask the person to change it after sign-in.</p>
        <form id="addUserForm">
          <div class="field"><label for="newUserName">Full name</label><input id="newUserName" maxlength="150" autocomplete="off" required></div>
          <div class="field"><label for="newUserEmail">Email address</label><input id="newUserEmail" type="email" maxlength="254" autocomplete="off" required></div>
          <div class="field"><label for="newUserRole">Account type</label><select id="newUserRole"><option value="user">User</option><option value="admin">Admin (OME staff)</option></select></div>
          <div class="field" id="newUserCategoryField"><label for="newUserCategory">University group</label><select id="newUserCategory"><option value="faculty">Faculty</option><option value="staff">Staff</option><option value="student">Student</option></select></div>
          <div class="field"><label for="newUserPassword">Temporary password</label><input id="newUserPassword" type="password" minlength="12" maxlength="128" autocomplete="new-password" required><p class="small muted">At least 12 characters. Do not reuse the shared admin passcode.</p></div>
          <div class="error-text" id="newUserError" role="alert"></div><button class="btn" type="submit">Add user</button>
        </form></div>
      <div><h2>Accounts <span class="muted">(${users.length})</span></h2><div class="users-list" role="list">${users.map(user => `<div class="users-item" role="listitem"><strong>${esc(user.full_name)}</strong><span>${esc(user.email)}</span><small>${user.role === 'admin' ? 'Admin · OME staff' : 'User · ' + categoryNames[user.category]}${Number(user.active) ? '' : ' · Inactive'}</small></div>`).join('') || '<p class="muted">No accounts yet.</p>'}</div></div></div></section>`;
    const form = root.querySelector('#addUserForm');
    const role = root.querySelector('#newUserRole');
    const categoryField = root.querySelector('#newUserCategoryField');
    role.addEventListener('change', () => { categoryField.hidden = role.value === 'admin'; });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const error = root.querySelector('#newUserError');
      error.textContent = ''; button.disabled = true;
      try {
        await api('add-user', 'POST', {
          fullName: root.querySelector('#newUserName').value.trim(),
          email: root.querySelector('#newUserEmail').value.trim(),
          role: role.value, category: role.value === 'admin' ? 'ome_staff' : root.querySelector('#newUserCategory').value,
          password: root.querySelector('#newUserPassword').value
        });
        render(root);
      } catch (e) { error.textContent = e.message; button.disabled = false; }
    });
  }

  O.views.users = render;
  O.views.account = root => {
    const user = O.Store.user;
    root.innerHTML = `<div class="card" style="max-width:560px;margin:24px auto"><h1>My account</h1><p><strong>${esc(user?.fullName || '')}</strong><br>${esc(user?.email || '')}<br>${user?.role === 'admin' ? 'OME staff admin' : esc(categoryNames[user?.category] || 'User')}</p><h2>Change password</h2><form id="changePasswordForm"><div class="field"><label for="currentPassword">Current password</label><input id="currentPassword" type="password" autocomplete="current-password" required></div><div class="field"><label for="nextPassword">New password</label><input id="nextPassword" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></div><div class="field"><label for="confirmPassword">Confirm new password</label><input id="confirmPassword" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></div><p class="small muted">Use at least 12 characters.</p><div class="error-text" id="passwordMessage" role="status"></div><button class="btn" type="submit">Save password</button></form></div>`;
    const form = root.querySelector('#changePasswordForm');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const message = root.querySelector('#passwordMessage');
      const button = form.querySelector('button');
      const next = root.querySelector('#nextPassword').value;
      message.textContent = '';
      if (next !== root.querySelector('#confirmPassword').value) { message.textContent = 'The new passwords do not match.'; return; }
      button.disabled = true;
      try {
        await api('change-password', 'POST', { currentPassword: root.querySelector('#currentPassword').value, newPassword: next });
        form.reset(); message.textContent = 'Password updated. Your other sessions have been signed out.';
      } catch (error) { message.textContent = error.message; }
      button.disabled = false;
    });
  };
})();
