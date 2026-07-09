// Profile (/profile) — edit name/department and upload an avatar.

import { html, escapeHtml } from '../utils/dom.js';
import { getCurrentUser, setCurrentUser } from '../services/session.js';
import { getProfile, updateProfile } from '../services/profileService.js';
import { uploadAvatar } from '../services/storageService.js';
import { showToast } from '../components/toast.js';

function avatarMarkup(url, name) {
  if (url) {
    return `<img src="${escapeHtml(url)}" alt="Avatar" id="avatar-img"
              class="rounded-circle object-fit-cover" style="width:96px;height:96px" />`;
  }
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return `<div id="avatar-img" class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
            style="width:96px;height:96px;font-size:2rem">${escapeHtml(initial)}</div>`;
}

export default async function render() {
  const user = getCurrentUser();
  const profile = (await getProfile(user.id)) || {};

  const node = html`
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-7">
          <h1 class="h3 mb-4">Profile</h1>

          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <div class="d-flex align-items-center gap-3 mb-4">
                <div id="avatar-wrap">${avatarMarkup(profile.avatar_url, profile.full_name || user.email)}</div>
                <div>
                  <label class="btn btn-outline-primary btn-sm mb-1" for="avatar-input">
                    <i class="bi bi-camera me-1"></i>Change photo
                  </label>
                  <input type="file" id="avatar-input" accept="image/*" class="d-none" />
                  <div class="text-muted small">${escapeHtml(user.email)}</div>
                </div>
              </div>

              <form id="profile-form" novalidate>
                <div class="mb-3">
                  <label class="form-label" for="full_name">Full name</label>
                  <input class="form-control" id="full_name" type="text"
                    value="${escapeHtml(profile.full_name || '')}" required />
                </div>
                <div class="mb-3">
                  <label class="form-label" for="department">Department</label>
                  <input class="form-control" id="department" type="text"
                    value="${escapeHtml(profile.department || '')}" placeholder="e.g. Engineering" />
                </div>
                <div class="mb-4">
                  <label class="form-label" for="allowance">Annual allowance</label>
                  <input class="form-control" id="allowance" type="text"
                    value="${profile.annual_allowance ?? 0} days" disabled />
                  <div class="form-text">Set by an administrator.</div>
                </div>
                <button class="btn btn-primary" type="submit" id="save-btn">
                  <i class="bi bi-check2 me-1"></i>Save changes
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Avatar upload
  const avatarInput = node.querySelector('#avatar-input');
  avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image is too large (max 5 MB).', 'error');
      return;
    }
    try {
      const url = await uploadAvatar(user.id, file);
      await updateProfile(user.id, { avatar_url: url });
      node.querySelector('#avatar-wrap').innerHTML = avatarMarkup(url, profile.full_name || user.email);
      setCurrentUser({ ...user, avatarUrl: url });
      showToast('Photo updated.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not upload photo.', 'error');
    }
  });

  // Save name/department
  const form = node.querySelector('#profile-form');
  const saveBtn = node.querySelector('#save-btn');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    const full_name = node.querySelector('#full_name').value.trim();
    const department = node.querySelector('#department').value.trim() || null;
    saveBtn.disabled = true;
    try {
      await updateProfile(user.id, { full_name, department });
      setCurrentUser({ ...getCurrentUser(), fullName: full_name, department });
      showToast('Profile saved.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not save profile.', 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  return node;
}
