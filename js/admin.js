/**
 * S. Video Creation — Portfolio Management Dashboard Application Logic
 * Supabase Auth, Row-Level-Security validation, YouTube URL processing, and Portfolio CRUD.
 * 
 * Hardened per project requirements:
 * - Non-blocking onAuthStateChange handling (no awaited DB calls inside event callback)
 * - Single-pass authorization check without duplicate login requests
 * - Stale-free DOM video preview and live thumbnail updates
 * - Safe unauthorized-user rejection and clean session cleanup
 * - Zero innerHTML interpolation of database values to eliminate Stored XSS
 * - Strict HTTPS image URL validation and 11-char YouTube ID verification
 */

(function () {
  'use strict';

  // State Management
  let currentUser = null;
  let currentAdminRole = null;
  let isCheckingAuth = false;
  let portfolioItems = [];
  let editingItemId = null;
  let itemPendingDelete = null;

  // Cache DOM Elements
  const authView = document.getElementById('authView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const authError = document.getElementById('authError');
  const logoutBtn = document.getElementById('logoutBtn');
  const userPillContainer = document.getElementById('userPillContainer');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  const userRoleDisplay = document.getElementById('userRoleDisplay');
  const configWarningBanner = document.getElementById('configWarningBanner');

  // Stats Elements
  const statTotal = document.getElementById('statTotal');
  const statPublished = document.getElementById('statPublished');
  const statDraft = document.getElementById('statDraft');
  const statFeatured = document.getElementById('statFeatured');

  // Controls Elements
  const searchInput = document.getElementById('searchInput');
  const filterCategory = document.getElementById('filterCategory');
  const filterStatus = document.getElementById('filterStatus');
  const filterOrientation = document.getElementById('filterOrientation');
  const tableBody = document.getElementById('portfolioTableBody');
  const emptyState = document.getElementById('emptyState');
  const openAddModalBtn = document.getElementById('openAddModalBtn');

  // Modal Elements
  const entryModal = document.getElementById('entryModal');
  const entryModalTitle = document.getElementById('entryModalTitle');
  const entryForm = document.getElementById('entryForm');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const saveEntryBtn = document.getElementById('saveEntryBtn');
  const saveDraftBtn = document.getElementById('saveDraftBtn');

  // Form Fields & Video Preview Elements
  const inputYoutubeUrl = document.getElementById('youtubeUrl');
  const ytPreviewCard = document.getElementById('ytPreviewCard');
  const ytPreviewId = document.getElementById('ytPreviewId');
  const testPlayBtn = document.getElementById('testPlayBtn');
  const ytVideoPlayerBox = document.getElementById('ytVideoPlayerBox');
  const inputTitleEn = document.getElementById('titleEn');
  const inputTitleHi = document.getElementById('titleHi');
  const inputDescEn = document.getElementById('descEn');
  const inputDescHi = document.getElementById('descHi');
  const selectCategory = document.getElementById('category');
  const selectOrientation = document.getElementById('orientation');
  const inputThumbnailUrl = document.getElementById('thumbnailUrl');
  const checkboxFeatured = document.getElementById('isFeatured');
  const selectStatus = document.getElementById('status');
  const inputSortOrder = document.getElementById('sortOrder');

  // Delete Confirmation Modal
  const deleteModal = document.getElementById('deleteModal');
  const deleteTitleSpan = document.getElementById('deleteItemTitle');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // ============================================================================
  // Initialization
  // ============================================================================

  document.addEventListener('DOMContentLoaded', () => {
    checkConfigurationStatus();
    initAuthListeners();
    initFormListeners();
    initTableListeners();
  });

  function checkConfigurationStatus() {
    if (!window.isSupabaseConfigured()) {
      if (configWarningBanner) configWarningBanner.style.display = 'flex';
      showToast('Supabase is not configured yet. Please configure js/supabase-client.js.', 'error');
    } else {
      if (configWarningBanner) configWarningBanner.style.display = 'none';
    }
  }

  // ============================================================================
  // Supabase Auth & Authorization Allowlist
  // ============================================================================

  function initAuthListeners() {
    const client = window.getSupabaseClient();
    if (!client) {
      showAuthView();
      return;
    }

    /**
     * Non-blocking onAuthStateChange handler.
     * Per Supabase security best practices:
     * - Do NOT await database calls inside this callback.
     * - Handle synchronous state resets on SIGNED_OUT or empty session.
     * - Schedule authorization verification asynchronously to prevent auth-lock deadlocks.
     * - Avoid duplicate calls on TOKEN_REFRESHED if the user is already verified.
     */
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session || !session.user) {
        currentUser = null;
        currentAdminRole = null;
        showAuthView();
        return;
      }

      // If token refreshed for current verified user, do not re-query database
      if (event === 'TOKEN_REFRESHED' && currentUser && currentUser.id === session.user.id) {
        return;
      }

      // If already verified, avoid duplicate check
      if (currentUser && currentUser.id === session.user.id) {
        return;
      }

      // Defer database query outside the auth event callback
      setTimeout(() => {
        verifyAndLoadUser(session.user);
      }, 0);
    });

    // Login Form Submit Handler
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        hideAuthError();

        const email = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {
          showAuthError('Please enter both email and password.');
          setLoginLoading(false);
          return;
        }

        const client = window.getSupabaseClient();
        if (!client) {
          showAuthError('Supabase is not configured. Check js/supabase-client.js.');
          setLoginLoading(false);
          return;
        }

        const { data, error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
          showAuthError(error.message || 'Login failed. Please check your credentials.');
          setLoginLoading(false);
          return;
        }

        // On successful sign-in, onAuthStateChange handles verifyAndLoadUser.
        // We do not call verifyAndLoadUser here, eliminating duplicate checks.
      });
    }

    // Logout Button
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const client = window.getSupabaseClient();
        if (client) {
          await client.auth.signOut();
        }
        currentUser = null;
        currentAdminRole = null;
        showAuthView();
        showToast('Signed out successfully.', 'success');
      });
    }
  }

  /**
   * Verifies that authenticated user is registered in the public.admin_users allowlist.
   * If not, signs them out and blocks dashboard access.
   */
  async function verifyAndLoadUser(user) {
    if (!user) return;
    if (isCheckingAuth) return;
    if (currentUser && currentUser.id === user.id) return;

    isCheckingAuth = true;
    setLoginLoading(true);

    const client = window.getSupabaseClient();
    if (!client) {
      isCheckingAuth = false;
      setLoginLoading(false);
      return;
    }

    try {
      const { data: adminRecord, error: adminError } = await client
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (adminError || !adminRecord) {
        console.warn('[S. Video Creation] Authenticated user is not on the admin allowlist:', user.email);
        await client.auth.signOut();
        currentUser = null;
        currentAdminRole = null;
        showAuthError('Access Denied: Your account is authenticated, but not on the authorized employee allowlist. Please contact the studio owner to authorize your email address.');
        showAuthView();
        return;
      }

      currentUser = user;
      currentAdminRole = adminRecord.role || 'admin';

      if (userEmailDisplay) userEmailDisplay.textContent = user.email;
      if (userRoleDisplay) userRoleDisplay.textContent = currentAdminRole;
      if (userPillContainer) userPillContainer.style.display = 'inline-flex';
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';

      showDashboardView();
      await fetchPortfolioItems();
    } catch (err) {
      console.error('[S. Video Creation] Error during authorization check:', err);
      showAuthError('Authorization check failed. Please check your connection.');
      showAuthView();
    } finally {
      isCheckingAuth = false;
      setLoginLoading(false);
    }
  }

  function showAuthView() {
    if (authView) authView.style.display = 'flex';
    if (dashboardView) dashboardView.style.display = 'none';
    if (userPillContainer) userPillContainer.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    setLoginLoading(false);
  }

  function showDashboardView() {
    if (authView) authView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
  }

  function showAuthError(msg) {
    if (authError) {
      authError.textContent = msg;
      authError.style.display = 'block';
    }
  }

  function hideAuthError() {
    if (authError) {
      authError.textContent = '';
      authError.style.display = 'none';
    }
  }

  function setLoginLoading(isLoading) {
    if (!loginSubmitBtn) return;
    if (isLoading) {
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = '<span class="admin-spinner"></span> Signing In...';
    } else {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.innerHTML = 'Sign In to Dashboard &rarr;';
    }
  }

  // ============================================================================
  // Video Preview Manager (Prevents Stale DOM References & Validates URLs)
  // ============================================================================

  /**
   * Updates the visible thumbnail image without destroying DOM elements.
   * Strictly validates that the image URL is a safe HTTPS URL.
   */
  function showThumbnailPreview(thumbUrl) {
    if (!ytVideoPlayerBox) return;

    // Remove any playing iframe to return to thumbnail state
    const existingIframe = ytVideoPlayerBox.querySelector('iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    let img = ytVideoPlayerBox.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.id = 'ytPreviewImg';
      img.className = 'admin-thumb-img';
      img.alt = 'Thumbnail preview';
      ytVideoPlayerBox.appendChild(img);
    }

    if (window.isValidImageUrl(thumbUrl)) {
      img.src = thumbUrl;
      img.style.display = 'block';
    } else {
      img.src = '';
      img.style.display = 'none';
    }
  }

  /**
   * Loads the privacy-enhanced YouTube embed player for in-dashboard playback test.
   */
  function showPlaybackPreview(embedUrl) {
    if (!ytVideoPlayerBox) return;

    const img = ytVideoPlayerBox.querySelector('img');
    if (img) {
      img.style.display = 'none';
    }

    let iframe = ytVideoPlayerBox.querySelector('iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.setAttribute('allow', 'autoplay; encrypted-media');
      iframe.setAttribute('allowfullscreen', 'true');
      ytVideoPlayerBox.appendChild(iframe);
    }
    iframe.src = embedUrl;
    iframe.style.display = 'block';
  }

  /**
   * Resets preview player: removes test iframe and clears image source.
   */
  function resetPreviewPlayer() {
    if (!ytVideoPlayerBox) return;

    const existingIframe = ytVideoPlayerBox.querySelector('iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const img = ytVideoPlayerBox.querySelector('img');
    if (img) {
      img.src = '';
      img.style.display = 'block';
    }
  }

  function handleYoutubeUrlChange() {
    const rawVal = inputYoutubeUrl ? inputYoutubeUrl.value.trim() : '';
    const videoId = window.extractYouTubeId(rawVal);

    if (videoId && window.isValidYouTubeId(videoId)) {
      inputYoutubeUrl.dataset.videoId = videoId;
      if (ytPreviewCard) ytPreviewCard.style.display = 'flex';
      if (ytPreviewId) ytPreviewId.textContent = `Valid Video ID: ${videoId}`;

      // Use custom thumbnail override if entered and valid, otherwise standard YouTube HQ thumbnail
      const customThumb = inputThumbnailUrl ? inputThumbnailUrl.value.trim() : '';
      const thumbUrl = (customThumb && window.isValidImageUrl(customThumb))
        ? customThumb
        : window.getYouTubeThumbnail(videoId, 'hqdefault');
      showThumbnailPreview(thumbUrl);

      if (testPlayBtn) testPlayBtn.disabled = false;

      // Auto-detect YouTube Short and adjust orientation
      if (window.isYouTubeShort(rawVal) && selectOrientation && selectOrientation.value !== 'portrait') {
        selectOrientation.value = 'portrait';
        if (ytVideoPlayerBox) ytVideoPlayerBox.classList.add('portrait');
        showToast('Detected YouTube Short format (switched to 9:16 Portrait).', 'success');
      }
    } else {
      if (inputYoutubeUrl) inputYoutubeUrl.dataset.videoId = '';
      if (ytPreviewCard) ytPreviewCard.style.display = 'none';
      if (testPlayBtn) testPlayBtn.disabled = true;
      resetPreviewPlayer();
    }
  }

  // ============================================================================
  // Portfolio CRUD Operations (Safe DOM Rendering - No Stored XSS)
  // ============================================================================

  async function fetchPortfolioItems() {
    const client = window.getSupabaseClient();
    if (!client) return;

    const { data, error } = await client
      .from('portfolio_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Error fetching portfolio items: ' + error.message, 'error');
      return;
    }

    portfolioItems = data || [];
    updateStats();
    renderTable();
  }

  function updateStats() {
    const total = portfolioItems.length;
    const published = portfolioItems.filter(i => i.status === 'published').length;
    const draft = portfolioItems.filter(i => i.status === 'draft').length;
    const featured = portfolioItems.filter(i => i.is_featured).length;

    if (statTotal) statTotal.textContent = String(total);
    if (statPublished) statPublished.textContent = String(published);
    if (statDraft) statDraft.textContent = String(draft);
    if (statFeatured) statFeatured.textContent = String(featured);
  }

  /**
   * Safely renders portfolio entries using DOM APIs and textContent.
   * Completely avoids innerHTML string interpolation of database-supplied content.
   */
  function renderTable() {
    if (!tableBody) return;

    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const cat = filterCategory ? filterCategory.value : 'all';
    const status = filterStatus ? filterStatus.value : 'all';
    const orientation = filterOrientation ? filterOrientation.value : 'all';

    const filtered = portfolioItems.filter(item => {
      const matchQuery = !query ||
        (item.title_en && item.title_en.toLowerCase().includes(query)) ||
        (item.title_hi && item.title_hi.toLowerCase().includes(query)) ||
        (item.youtube_video_id && item.youtube_video_id.toLowerCase().includes(query));

      const matchCat = cat === 'all' || item.category === cat;
      const matchStatus = status === 'all' || item.status === status;
      const matchOrientation = orientation === 'all' || item.orientation === orientation;

      return matchQuery && matchCat && matchStatus && matchOrientation;
    });

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((item) => {
      const tr = document.createElement('tr');
      const isPortrait = item.orientation === 'portrait';
      const defaultThumb = window.getYouTubeThumbnail(item.youtube_video_id, 'hqdefault');
      const safeThumbUrl = (item.thumbnail_url && window.isValidImageUrl(item.thumbnail_url))
        ? item.thumbnail_url
        : defaultThumb;

      // 1. Thumbnail cell
      const tdThumb = document.createElement('td');
      tdThumb.className = 'admin-thumb-cell';
      const previewDiv = document.createElement('div');
      previewDiv.className = `admin-thumb-preview ${isPortrait ? 'portrait' : ''}`;
      const thumbImg = document.createElement('img');
      thumbImg.src = safeThumbUrl;
      thumbImg.alt = item.title_en || 'Thumbnail preview';
      thumbImg.className = 'admin-thumb-img';
      thumbImg.loading = 'lazy';
      thumbImg.onerror = function () {
        if (thumbImg.src !== defaultThumb && defaultThumb) {
          thumbImg.src = defaultThumb;
        }
      };
      previewDiv.appendChild(thumbImg);
      tdThumb.appendChild(previewDiv);
      tr.appendChild(tdThumb);

      // 2. Title & Details cell
      const tdTitle = document.createElement('td');
      const titlesDiv = document.createElement('div');
      titlesDiv.className = 'admin-entry-titles';

      const titleEnSpan = document.createElement('span');
      titleEnSpan.className = 'admin-entry-title-en';
      titleEnSpan.textContent = item.title_en || '';
      titlesDiv.appendChild(titleEnSpan);

      if (item.title_hi) {
        const titleHiSpan = document.createElement('span');
        titleHiSpan.className = 'admin-entry-title-hi';
        titleHiSpan.textContent = item.title_hi;
        titlesDiv.appendChild(titleHiSpan);
      }

      const metaDiv = document.createElement('div');
      metaDiv.className = 'admin-entry-meta';
      const idSpan = document.createElement('span');
      idSpan.textContent = `ID: ${item.youtube_video_id || ''}`;
      metaDiv.appendChild(idSpan);

      if (item.is_featured) {
        const featBadge = document.createElement('span');
        featBadge.className = 'badge badge-featured';
        featBadge.textContent = '★ Featured';
        metaDiv.appendChild(featBadge);
      }
      titlesDiv.appendChild(metaDiv);
      tdTitle.appendChild(titlesDiv);
      tr.appendChild(tdTitle);

      // 3. Category cell
      const tdCat = document.createElement('td');
      const catBadge = document.createElement('span');
      catBadge.className = 'badge badge-category';
      catBadge.textContent = item.category || 'other';
      tdCat.appendChild(catBadge);
      tr.appendChild(tdCat);

      // 4. Orientation cell
      const tdOrient = document.createElement('td');
      const orientBadge = document.createElement('span');
      orientBadge.className = 'badge badge-orientation';
      orientBadge.textContent = isPortrait ? '9:16 Vertical' : '16:9 Landscape';
      tdOrient.appendChild(orientBadge);
      tr.appendChild(tdOrient);

      // 5. Status cell
      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = `badge ${item.status === 'published' ? 'badge-published' : 'badge-draft'}`;
      statusBadge.textContent = item.status === 'published' ? '● Published' : '○ Draft';
      tdStatus.appendChild(statusBadge);
      tr.appendChild(tdStatus);

      // 6. Sort Order cell
      const tdOrder = document.createElement('td');
      const orderSpan = document.createElement('span');
      orderSpan.style.fontFamily = 'monospace';
      orderSpan.style.fontWeight = '700';
      orderSpan.style.color = '#FFFFFF';
      orderSpan.textContent = String(item.sort_order ?? 0);
      tdOrder.appendChild(orderSpan);
      tr.appendChild(tdOrder);

      // 7. Actions cell
      const tdActions = document.createElement('td');
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'admin-actions-cell';

      const btnStatus = document.createElement('button');
      btnStatus.type = 'button';
      btnStatus.className = 'admin-btn admin-btn-outline admin-btn-sm btn-quick-status';
      btnStatus.setAttribute('data-id', item.id);
      btnStatus.title = 'Toggle Published / Draft';
      btnStatus.textContent = item.status === 'published' ? 'Unpublish' : 'Publish';
      actionsDiv.appendChild(btnStatus);

      const btnFeature = document.createElement('button');
      btnFeature.type = 'button';
      btnFeature.className = 'admin-btn admin-btn-outline admin-btn-sm btn-quick-feature';
      btnFeature.setAttribute('data-id', item.id);
      btnFeature.title = 'Toggle Featured on Homepage';
      btnFeature.textContent = item.is_featured ? 'Unfeature' : 'Feature';
      actionsDiv.appendChild(btnFeature);

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'admin-btn admin-btn-secondary admin-btn-sm btn-edit';
      btnEdit.setAttribute('data-id', item.id);
      btnEdit.textContent = 'Edit';
      actionsDiv.appendChild(btnEdit);

      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'admin-btn admin-btn-danger admin-btn-sm btn-delete';
      btnDelete.setAttribute('data-id', item.id);
      btnDelete.textContent = 'Delete';
      actionsDiv.appendChild(btnDelete);

      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });
  }

  function initTableListeners() {
    if (searchInput) searchInput.addEventListener('input', renderTable);
    if (filterCategory) filterCategory.addEventListener('change', renderTable);
    if (filterStatus) filterStatus.addEventListener('change', renderTable);
    if (filterOrientation) filterOrientation.addEventListener('change', renderTable);

    if (tableBody) {
      tableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.getAttribute('data-id');
        const item = portfolioItems.find(i => i.id === id);
        if (!item) return;

        // Edit
        if (target.classList.contains('btn-edit')) {
          openEditModal(item);
        }
        // Delete
        else if (target.classList.contains('btn-delete')) {
          openDeleteModal(item);
        }
        // Quick Toggle Publish / Draft
        else if (target.classList.contains('btn-quick-status')) {
          const newStatus = item.status === 'published' ? 'draft' : 'published';
          await updateItemField(item.id, { status: newStatus }, `Status updated to ${newStatus}`);
        }
        // Quick Toggle Featured
        else if (target.classList.contains('btn-quick-feature')) {
          const newFeatured = !item.is_featured;
          await updateItemField(item.id, { is_featured: newFeatured }, newFeatured ? 'Marked as homepage feature' : 'Removed from homepage features');
        }
      });
    }
  }

  async function updateItemField(id, fields, successMsg) {
    const client = window.getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('portfolio_items')
      .update(fields)
      .eq('id', id);

    if (error) {
      showToast('Error updating entry: ' + error.message, 'error');
    } else {
      showToast(successMsg, 'success');
      await fetchPortfolioItems();
    }
  }

  // ============================================================================
  // Add / Edit Entry Form
  // ============================================================================

  function initFormListeners() {
    // Open Add Modal
    if (openAddModalBtn) {
      openAddModalBtn.addEventListener('click', () => {
        openAddModal();
      });
    }

    // Close Modals
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeEntryModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeEntryModal);

    // Escape Key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (entryModal && entryModal.classList.contains('active')) closeEntryModal();
        if (deleteModal && deleteModal.classList.contains('active')) closeDeleteModal();
      }
    });

    // YouTube URL Input Live Validation & Instant Preview Update
    if (inputYoutubeUrl) {
      inputYoutubeUrl.addEventListener('input', handleYoutubeUrlChange);
      inputYoutubeUrl.addEventListener('paste', () => setTimeout(handleYoutubeUrlChange, 50));
    }

    // Custom Thumbnail URL Input also updates preview immediately
    if (inputThumbnailUrl) {
      inputThumbnailUrl.addEventListener('input', () => {
        const videoId = inputYoutubeUrl ? inputYoutubeUrl.dataset.videoId : '';
        if (videoId && window.isValidYouTubeId(videoId)) {
          const custom = inputThumbnailUrl.value.trim();
          const safeUrl = (custom && window.isValidImageUrl(custom))
            ? custom
            : window.getYouTubeThumbnail(videoId, 'hqdefault');
          showThumbnailPreview(safeUrl);
        }
      });
    }

    // Orientation change updates preview aspect ratio
    if (selectOrientation) {
      selectOrientation.addEventListener('change', () => {
        const isPortrait = selectOrientation.value === 'portrait';
        if (ytVideoPlayerBox) {
          ytVideoPlayerBox.classList.toggle('portrait', isPortrait);
        }
      });
    }

    // Test Playback in Preview
    if (testPlayBtn) {
      testPlayBtn.addEventListener('click', () => {
        const videoId = inputYoutubeUrl ? inputYoutubeUrl.dataset.videoId : null;
        if (!videoId || !window.isValidYouTubeId(videoId)) return;

        const embedUrl = window.getYouTubeEmbedUrl(videoId, { autoplay: 1 });
        if (embedUrl) {
          showPlaybackPreview(embedUrl);
        }
      });
    }

    // Form Submission: Save as Draft
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        savePortfolioItem('draft');
      });
    }

    // Form Submission: Save / Publish
    if (entryForm) {
      entryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const chosenStatus = selectStatus ? selectStatus.value : 'published';
        savePortfolioItem(chosenStatus);
      });
    }

    // Delete Modal Actions
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', executeDelete);
    }
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
  }

  function openAddModal() {
    editingItemId = null;
    if (entryModalTitle) entryModalTitle.textContent = 'Add New Portfolio Entry';
    if (saveEntryBtn) saveEntryBtn.textContent = 'Publish Video Entry';
    if (entryForm) entryForm.reset();

    if (inputYoutubeUrl) inputYoutubeUrl.dataset.videoId = '';
    if (ytPreviewCard) ytPreviewCard.style.display = 'none';
    resetPreviewPlayer();

    // Default next sort order
    const maxOrder = portfolioItems.reduce((max, i) => Math.max(max, i.sort_order || 0), 0);
    if (inputSortOrder) inputSortOrder.value = String(maxOrder + 10);

    if (entryModal) entryModal.classList.add('active');
    setTimeout(() => { if (inputYoutubeUrl) inputYoutubeUrl.focus(); }, 100);
  }

  function openEditModal(item) {
    editingItemId = item.id;
    if (entryModalTitle) entryModalTitle.textContent = 'Edit Portfolio Entry';
    if (saveEntryBtn) saveEntryBtn.textContent = 'Save Changes';

    if (inputYoutubeUrl) {
      inputYoutubeUrl.value = item.youtube_url || '';
      inputYoutubeUrl.dataset.videoId = item.youtube_video_id || '';
    }
    if (inputTitleEn) inputTitleEn.value = item.title_en || '';
    if (inputTitleHi) inputTitleHi.value = item.title_hi || '';
    if (inputDescEn) inputDescEn.value = item.description_en || '';
    if (inputDescHi) inputDescHi.value = item.description_hi || '';
    if (selectCategory) selectCategory.value = item.category || 'editing';
    if (selectOrientation) {
      selectOrientation.value = item.orientation || 'landscape';
      if (ytVideoPlayerBox) {
        ytVideoPlayerBox.classList.toggle('portrait', item.orientation === 'portrait');
      }
    }
    if (inputThumbnailUrl) inputThumbnailUrl.value = item.thumbnail_url || '';
    if (checkboxFeatured) checkboxFeatured.checked = !!item.is_featured;
    if (selectStatus) selectStatus.value = item.status || 'draft';
    if (inputSortOrder) inputSortOrder.value = String(item.sort_order ?? 0);

    // Show Preview with fresh validated thumbnail
    if (ytPreviewCard) ytPreviewCard.style.display = 'flex';
    if (ytPreviewId) ytPreviewId.textContent = `Video ID: ${item.youtube_video_id || ''}`;
    const defaultThumb = window.getYouTubeThumbnail(item.youtube_video_id, 'hqdefault');
    const safeThumbUrl = (item.thumbnail_url && window.isValidImageUrl(item.thumbnail_url))
      ? item.thumbnail_url
      : defaultThumb;
    showThumbnailPreview(safeThumbUrl);

    if (testPlayBtn) testPlayBtn.disabled = !window.isValidYouTubeId(item.youtube_video_id);

    if (entryModal) entryModal.classList.add('active');
  }

  function closeEntryModal() {
    if (entryModal) entryModal.classList.remove('active');
    editingItemId = null;
    resetPreviewPlayer();
  }

  async function savePortfolioItem(targetStatus) {
    const rawUrl = inputYoutubeUrl ? inputYoutubeUrl.value.trim() : '';
    const videoId = (inputYoutubeUrl && inputYoutubeUrl.dataset.videoId) || window.extractYouTubeId(rawUrl);

    if (!videoId || !window.isValidYouTubeId(videoId)) {
      showToast('Please provide a valid YouTube watch URL, youtu.be link, or Shorts URL.', 'error');
      if (inputYoutubeUrl) inputYoutubeUrl.focus();
      return;
    }

    // Normalize URL to clean canonical YouTube URL (e.g. watch?v= or /shorts/)
    const canonicalUrl = window.normalizeYouTubeUrl(rawUrl, videoId);
    if (!canonicalUrl) {
      showToast('Could not resolve a canonical YouTube URL.', 'error');
      if (inputYoutubeUrl) inputYoutubeUrl.focus();
      return;
    }

    const titleEn = inputTitleEn ? inputTitleEn.value.trim() : '';
    if (!titleEn) {
      showToast('Please provide a title in English.', 'error');
      if (inputTitleEn) inputTitleEn.focus();
      return;
    }

    if (titleEn.length > 255) {
      showToast('Title must be 255 characters or fewer.', 'error');
      if (inputTitleEn) inputTitleEn.focus();
      return;
    }

    const customThumb = inputThumbnailUrl ? inputThumbnailUrl.value.trim() : '';
    if (customThumb && !window.isValidImageUrl(customThumb)) {
      showToast('Custom thumbnail URL must be a valid, secure HTTPS image link (https://...).', 'error');
      if (inputThumbnailUrl) inputThumbnailUrl.focus();
      return;
    }

    const payload = {
      youtube_video_id: videoId,
      youtube_url: canonicalUrl,
      title_en: titleEn,
      title_hi: (inputTitleHi && inputTitleHi.value.trim()) || null,
      description_en: (inputDescEn && inputDescEn.value.trim()) || null,
      description_hi: (inputDescHi && inputDescHi.value.trim()) || null,
      category: selectCategory ? selectCategory.value : 'editing',
      orientation: selectOrientation ? selectOrientation.value : 'landscape',
      thumbnail_url: customThumb || null,
      is_featured: checkboxFeatured ? checkboxFeatured.checked : false,
      status: targetStatus || (selectStatus ? selectStatus.value : 'published'),
      sort_order: parseInt(inputSortOrder ? inputSortOrder.value : '0', 10) || 0
    };

    const client = window.getSupabaseClient();
    if (!client) {
      showToast('Supabase client is not available.', 'error');
      return;
    }

    setFormLoading(true);

    try {
      if (editingItemId) {
        // Update existing record
        const { error } = await client
          .from('portfolio_items')
          .update(payload)
          .eq('id', editingItemId);

        if (error) throw error;
        showToast('Portfolio entry updated successfully!', 'success');
      } else {
        // Insert new record
        const { error } = await client
          .from('portfolio_items')
          .insert([payload]);

        if (error) throw error;
        showToast('New portfolio entry created successfully!', 'success');
      }

      closeEntryModal();
      await fetchPortfolioItems();
    } catch (err) {
      console.error('[S. Video Creation] Save failed:', err);
      showToast('Failed to save entry: ' + (err.message || 'Database error'), 'error');
      // Inputs remain intact so user does not lose entered text
    } finally {
      setFormLoading(false);
    }
  }

  function setFormLoading(isLoading) {
    if (saveEntryBtn) {
      saveEntryBtn.disabled = isLoading;
      if (isLoading) {
        saveEntryBtn.innerHTML = '<span class="admin-spinner"></span> Saving...';
      } else {
        saveEntryBtn.textContent = editingItemId ? 'Save Changes' : 'Publish Video Entry';
      }
    }
    if (saveDraftBtn) saveDraftBtn.disabled = isLoading;
    if (cancelModalBtn) cancelModalBtn.disabled = isLoading;
  }

  // ============================================================================
  // Delete Modal & Deletion Execution
  // ============================================================================

  function openDeleteModal(item) {
    itemPendingDelete = item;
    if (deleteTitleSpan) deleteTitleSpan.textContent = item.title_en || 'this entry';
    if (deleteModal) deleteModal.classList.add('active');
  }

  function closeDeleteModal() {
    if (deleteModal) deleteModal.classList.remove('active');
    itemPendingDelete = null;
  }

  async function executeDelete() {
    if (!itemPendingDelete) return;

    const client = window.getSupabaseClient();
    if (!client) return;

    if (confirmDeleteBtn) {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.innerHTML = '<span class="admin-spinner"></span> Deleting...';
    }

    try {
      const { error } = await client
        .from('portfolio_items')
        .delete()
        .eq('id', itemPendingDelete.id);

      if (error) throw error;

      showToast('Portfolio entry deleted successfully.', 'success');
      closeDeleteModal();
      await fetchPortfolioItems();
    } catch (err) {
      console.error('[S. Video Creation] Delete failed:', err);
      showToast('Failed to delete entry: ' + (err.message || 'Database error'), 'error');
    } finally {
      if (confirmDeleteBtn) {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Yes, Delete Entry';
      }
    }
  }

  // ============================================================================
  // Toast Notification System
  // ============================================================================

  function showToast(message, type = 'success') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type === 'error' ? 'admin-toast-error' : 'admin-toast-success'}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 260);
    }, 4000);
  }

})();
