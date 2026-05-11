/* ============================================
   MOZZ VADER — ADMIN PANEL
   Auth, CRUD, Image Upload
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
  const SUPABASE_BUCKET = window.SUPABASE_BUCKET || 'portfolio-images';

  // ─── Supabase Client ───
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ─── DOM References ───
  const adminLogin = document.getElementById('adminLogin');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const addProjectBtn = document.getElementById('addProjectBtn');
  const projectModal = document.getElementById('projectModal');
  const projectModalOverlay = document.getElementById('projectModalOverlay');
  const projectForm = document.getElementById('projectForm');
  const modalTitle = document.getElementById('modalTitle');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const formError = document.getElementById('formError');
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const uploadPreview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const removeImageBtn = document.getElementById('removeImageBtn');
  const imageUrlInput = document.getElementById('imageUrl');
  const uploadError = document.getElementById('uploadError');
  const uploadProgress = document.getElementById('uploadProgress');
  const deleteModal = document.getElementById('deleteModal');
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteCloseBtn = document.getElementById('deleteCloseBtn');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteProjectName = document.getElementById('deleteProjectName');
  const projectsList = document.getElementById('projectsList');
  const adminThemeToggle = document.getElementById('adminThemeToggle');
  const googleLoginBtn = document.getElementById('googleLoginBtn');

  let editingProjectId = null;
  let deleteTargetId = null;
  let oldImageUrl = null; // track previous image to clean up storage

  // ─── Theme Toggle ───
  function initAdminTheme() {
    const saved = localStorage.getItem('mozz-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  if (adminThemeToggle) {
    adminThemeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('mozz-theme', next);
    });
  }

  initAdminTheme();

  // ─── Auth ───
  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    adminLogin.style.display = 'flex';
    adminDashboard.style.display = 'none';
  }

  function showDashboard() {
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadProjects();
  }

  // Login form
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    loginError.style.display = 'none';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      loginError.textContent = error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : 'Error al iniciar sesión: ' + error.message;
      loginError.style.display = 'block';
      return;
    }

    showDashboard();
  });

  // Google OAuth Login
  googleLoginBtn.addEventListener('click', async () => {
    loginError.style.display = 'none';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) {
      loginError.textContent = 'Error al conectar con Google: ' + error.message;
      loginError.style.display = 'block';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLogin();
  });

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') showDashboard();
    if (event === 'SIGNED_OUT') showLogin();
  });

  // ─── Load Projects ───
  async function loadProjects() {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading projects:', error);
      projectsList.innerHTML = '<div class="admin-empty-list"><p>Error al cargar proyectos</p></div>';
      return;
    }

    // Update stats
    document.getElementById('statTotal').textContent = projects.length;
    document.getElementById('statVisible').textContent = projects.filter(p => p.visible).length;
    document.getElementById('statHidden').textContent = projects.filter(p => !p.visible).length;

    if (projects.length === 0) {
      projectsList.innerHTML = `
        <div class="admin-empty-list">
          <p>No hay proyectos todavía</p>
        </div>
      `;
      return;
    }

    projectsList.innerHTML = projects.map(project => {
      const tags = Array.isArray(project.tags) ? project.tags : [];
      const thumbHTML = project.image_url
        ? `<div class="admin-project-thumb"><img src="${escapeAttr(project.image_url)}" alt=""></div>`
        : `<div class="admin-project-thumb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

      return `
        <div class="admin-project-row" data-id="${project.id}">
          ${thumbHTML}
          <div class="admin-project-info">
            <h3>${escapeHTML(project.title)}</h3>
            ${tags.length > 0 ? `<div class="admin-project-tags">${tags.map(t => `<span>${escapeHTML(t)}</span>`).join('')}</div>` : ''}
          </div>
          <div class="admin-project-status">
            <span class="admin-status-dot ${project.visible ? '' : 'hidden'}"></span>
            <span class="admin-status-label">${project.visible ? 'Visible' : 'Oculto'}</span>
          </div>
          <div class="admin-project-actions">
            <button class="admin-btn-icon edit-btn" data-id="${project.id}" aria-label="Editar" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="admin-btn-icon danger delete-btn" data-id="${project.id}" data-name="${escapeAttr(project.title)}" aria-label="Eliminar" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event handlers
    projectsList.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditProject(btn.dataset.id));
    });

    projectsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });
  }

  // ─── Project Modal ───
  function openModal() {
    projectModal.classList.add('active');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    projectModal.classList.remove('active');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetForm();
  }

  function resetForm() {
    projectForm.reset();
    editingProjectId = null;
    oldImageUrl = null;
    imageUrlInput.value = '';
    formError.style.display = 'none';
    uploadError.style.display = 'none';
    uploadProgress.style.display = 'none';
    showUploadPlaceholder();
    modalTitle.textContent = 'Agregar Proyecto';
  }

  modalCloseBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  projectModalOverlay.addEventListener('click', closeModal);

  addProjectBtn.addEventListener('click', () => {
    resetForm();
    modalTitle.textContent = 'Agregar Proyecto';
    openModal();
  });

  // ─── Edit Project ───
  async function openEditProject(id) {
    resetForm();
    modalTitle.textContent = 'Editar Proyecto';
    editingProjectId = id;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      console.error('Error fetching project:', error);
      return;
    }

    oldImageUrl = project.image_url || null;

    document.getElementById('projectId').value = project.id;
    document.getElementById('projectTitle').value = project.title;
    document.getElementById('projectDesc').value = project.description;
    document.getElementById('projectTags').value = Array.isArray(project.tags) ? project.tags.join(', ') : '';
    document.getElementById('projectDemo').value = project.demo_url || '';
    document.getElementById('projectRepo').value = project.repo_url || '';
    document.getElementById('projectSort').value = project.sort_order;
    document.getElementById('projectVisible').checked = project.visible;

    if (project.image_url) {
      imageUrlInput.value = project.image_url;
      previewImg.src = project.image_url;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.style.display = 'inline-block';
    }

    openModal();
  }

  // ─── Save Project ───
  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';

    const title = document.getElementById('projectTitle').value.trim();
    const description = document.getElementById('projectDesc').value.trim();
    const tagsStr = document.getElementById('projectTags').value.trim();
    const demo_url = document.getElementById('projectDemo').value.trim() || null;
    const repo_url = document.getElementById('projectRepo').value.trim() || null;
    const sort_order = parseInt(document.getElementById('projectSort').value) || 0;
    const visible = document.getElementById('projectVisible').checked;
    const image_url = imageUrlInput.value || null;

    if (!title || !description) {
      formError.textContent = 'El título y la descripción son obligatorios.';
      formError.style.display = 'block';
      return;
    }

    const tags = tagsStr
      ? tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.querySelector('span').textContent;
    saveBtn.querySelector('span').textContent = 'Guardando...';
    saveBtn.disabled = true;

    try {
      let result;

      if (editingProjectId) {
        result = await supabase
          .from('projects')
          .update({ title, description, tags, image_url, demo_url, repo_url, sort_order, visible })
          .eq('id', editingProjectId);

        // Clean up old image from storage if it changed
        if (oldImageUrl && oldImageUrl !== image_url && getStorageFilePath(oldImageUrl)) {
          deleteOldStorageImage(oldImageUrl);
        }
        oldImageUrl = null;
      } else {
        result = await supabase
          .from('projects')
          .insert({ title, description, tags, image_url, demo_url, repo_url, sort_order, visible });
      }

      if (result.error) throw result.error;

      closeModal();
      loadProjects();
    } catch (err) {
      console.error('Error saving project:', err);
      formError.textContent = 'Error al guardar: ' + (err.message || 'Intentá de nuevo.');
      formError.style.display = 'block';
    } finally {
      saveBtn.querySelector('span').textContent = originalText;
      saveBtn.disabled = false;
    }
  });

  // ─── Image Upload ───
  uploadArea.addEventListener('click', () => imageInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  });

  imageInput.addEventListener('change', () => {
    if (imageInput.files[0]) handleImageUpload(imageInput.files[0]);
  });

  removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    imageUrlInput.value = '';
    showUploadPlaceholder();
  });

  function showUploadPlaceholder() {
    uploadPlaceholder.style.display = 'block';
    uploadPreview.style.display = 'none';
    previewImg.src = '';
  }

  async function handleImageUpload(file) {
    uploadError.style.display = 'none';

    // Validate
    if (!file.type.startsWith('image/')) {
      uploadError.textContent = 'Solo se permiten imágenes (JPG, PNG, WebP).';
      uploadError.style.display = 'block';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      uploadError.textContent = 'La imagen no debe superar los 2MB.';
      uploadError.style.display = 'block';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    uploadProgress.style.display = 'flex';

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      uploadProgress.style.display = 'none';

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(data.path);

      imageUrlInput.value = publicUrl;
    } catch (err) {
      uploadProgress.style.display = 'none';
      console.error('Upload error:', err);
      uploadError.textContent = 'Error al subir la imagen. Intentá de nuevo.';
      uploadError.style.display = 'block';
      showUploadPlaceholder();
    }
  }

  // ─── Delete Project ───
  function openDeleteModal(id, name) {
    deleteTargetId = id;
    deleteProjectName.textContent = name;
    deleteModal.classList.add('active');
    deleteModal.setAttribute('aria-hidden', 'false');
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteModal.setAttribute('aria-hidden', 'true');
    deleteTargetId = null;
  }

  deleteCloseBtn.addEventListener('click', closeDeleteModal);
  deleteCancelBtn.addEventListener('click', closeDeleteModal);
  deleteModalOverlay.addEventListener('click', closeDeleteModal);

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!deleteTargetId) return;

    const btn = confirmDeleteBtn;
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Eliminando...';

    try {
      // Fetch image URL before deleting the row
      const { data: projToDelete } = await supabase
        .from('projects')
        .select('image_url')
        .eq('id', deleteTargetId)
        .single();

      const oldImg = projToDelete?.image_url || null;

      const { error: delError } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteTargetId);

      if (delError) throw delError;

      // Clean up image from storage
      if (oldImg) deleteOldStorageImage(oldImg);

      closeDeleteModal();
      loadProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Error al eliminar el proyecto.');
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Eliminar';
    }
  });

  // ─── Helpers ───
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Extract file path from Supabase Storage public URL
  function getStorageFilePath(url) {
    if (!url) return null;
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  }

  // Delete old image from Supabase Storage (silent — don't fail the save)
  async function deleteOldStorageImage(url) {
    const filePath = getStorageFilePath(url);
    if (!filePath) return;
    try {
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .remove([filePath]);
      if (error) console.warn('Could not delete old image:', error.message);
    } catch (e) {
      console.warn('Could not delete old image:', e.message);
    }
  }

  // ─── Init ───
  checkSession();
});
