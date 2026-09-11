/*
==========================================================
    FileTransfer Pro v2
    UI Coordinator & Media Lightbox Controller
==========================================================
*/

"use strict";

const UI = {
    allFiles: [],
    currentRenameFile: null,

    init() {
        this.bindCategoryTabs();
        this.bindToolbar();
        this.bindModals();
        this.bindClipboard();
        this.bindMobileNav();
        this.loadFiles();
    },

    /* ==========================================
       CATEGORY TABS
    ========================================== */
    bindCategoryTabs() {
        const tabs = document.querySelectorAll(".tab-btn");
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                const cat = tab.getAttribute("data-cat");
                App.state.activeCategory = cat;

                const clipboardPanel = document.getElementById("clipboardPanel");
                const filesContainer = document.getElementById("filesContainer");
                const toolbar = document.querySelector(".explorer-toolbar");

                if (cat === "clipboard") {
                    if (filesContainer) filesContainer.style.display = "none";
                    if (toolbar) toolbar.style.display = "none";
                    if (clipboardPanel) clipboardPanel.style.display = "flex";
                    this.loadClipboard();
                } else {
                    if (clipboardPanel) clipboardPanel.style.display = "none";
                    if (filesContainer) filesContainer.style.display = App.state.viewMode === "grid" ? "grid" : "flex";
                    if (toolbar) toolbar.style.display = "flex";
                    this.renderFiles();
                }
            });
        });
    },

    /* ==========================================
       TOOLBAR (SEARCH, SORT, VIEW)
    ========================================== */
    bindToolbar() {
        const searchInput = document.getElementById("searchInput");
        const clearSearchBtn = document.getElementById("clearSearchBtn");
        const sortSelect = document.getElementById("sortSelect");
        const gridViewBtn = document.getElementById("gridViewBtn");
        const listViewBtn = document.getElementById("listViewBtn");
        const refreshBtn = document.getElementById("refreshBtn");

        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener("input", (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    App.state.searchQuery = e.target.value.trim().toLowerCase();
                    if (clearSearchBtn) clearSearchBtn.style.display = App.state.searchQuery ? "block" : "none";
                    this.renderFiles();
                }, 180);
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener("click", () => {
                if (searchInput) {
                    searchInput.value = "";
                    App.state.searchQuery = "";
                    clearSearchBtn.style.display = "none";
                    this.renderFiles();
                }
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener("change", (e) => {
                App.state.sortBy = e.target.value;
                this.renderFiles();
            });
        }

        if (gridViewBtn && listViewBtn) {
            gridViewBtn.addEventListener("click", () => {
                App.state.viewMode = "grid";
                localStorage.setItem("ft_view", "grid");
                gridViewBtn.classList.add("active");
                listViewBtn.classList.remove("active");
                const container = document.getElementById("filesContainer");
                if (container) {
                    container.className = "files-container grid-view";
                }
            });

            listViewBtn.addEventListener("click", () => {
                App.state.viewMode = "list";
                localStorage.setItem("ft_view", "list");
                listViewBtn.classList.add("active");
                gridViewBtn.classList.remove("active");
                const container = document.getElementById("filesContainer");
                if (container) {
                    container.className = "files-container list-view";
                }
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
                this.loadFiles();
                App.showToast("Refreshed files", "info");
                App.playSound("pop");
            });
        }
    },

    /* ==========================================
       FETCH & LOAD FILES
    ========================================== */
    async loadFiles() {
        try {
            const headers = {};
            if (window.App && window.App.session && window.App.session.id) {
                headers["x-session-id"] = window.App.session.id;
                headers["x-session-token"] = window.App.session.token;
            }

            const res = await fetch("/api/files", { headers });
            const data = await res.json();
            if (!data.success) return;

            this.allFiles = data.files || [];
            
            const stats = data.stats || {
                totalFiles: this.allFiles.length,
                totalSize: data.totalSize || 0,
                formattedTotalSize: data.formattedTotalSize || "0 Bytes",
                categories: {
                    image: this.allFiles.filter(f => f.category === 'image').length,
                    video: this.allFiles.filter(f => f.category === 'video').length,
                    audio: this.allFiles.filter(f => f.category === 'audio').length,
                    document: this.allFiles.filter(f => f.category === 'document').length,
                    archive: this.allFiles.filter(f => f.category === 'archive').length,
                    other: this.allFiles.filter(f => !['image','video','audio','document','archive'].includes(f.category)).length
                }
            };

            this.updateStats(stats);
            this.renderFiles();
        } catch (err) {
            console.error("Load files error:", err);
        }
    },

    updateStats(stats) {
        if (!stats) return;

        const totalFiles = document.getElementById("totalFilesCount");
        const totalStorage = document.getElementById("totalStorageSize");
        if (totalFiles) totalFiles.textContent = stats.totalFiles;
        if (totalStorage) totalStorage.textContent = stats.formattedTotalSize;

        // Update Category Badges
        const cats = stats.categories || {};
        const setBadge = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || 0;
        };

        setBadge("catBadgeAll", stats.totalFiles);
        setBadge("catBadgeImage", cats.image);
        setBadge("catBadgeVideo", cats.video);
        setBadge("catBadgeAudio", cats.audio);
        setBadge("catBadgeDoc", cats.document);
        setBadge("catBadgeArchive", cats.archive);

        // Update Storage Distribution Bar
        const total = stats.totalSize || 1;
        const setSeg = (id, size) => {
            const el = document.getElementById(id);
            if (el) {
                const pct = Math.max(1, ((size || 0) / total) * 100);
                el.style.width = stats.totalFiles > 0 ? `${pct}%` : "0%";
            }
        };
        // Simplified estimate by count
        setSeg("segImage", cats.image);
        setSeg("segVideo", cats.video);
        setSeg("segAudio", cats.audio);
        setSeg("segDoc", cats.document);
        setSeg("segArchive", cats.archive);
        setSeg("segOther", cats.other);
    },

    /* ==========================================
       RENDER FILE CARDS
    ========================================== */
    renderFiles() {
        const container = document.getElementById("filesContainer");
        if (!container) return;

        let files = [...this.allFiles];

        // Filter Category
        if (App.state.activeCategory !== "all") {
            files = files.filter(f => f.category === App.state.activeCategory);
        }

        // Filter Search
        if (App.state.searchQuery) {
            files = files.filter(f => 
                f.name.toLowerCase().includes(App.state.searchQuery) ||
                (f.originalName && f.originalName.toLowerCase().includes(App.state.searchQuery))
            );
        }

        // Sort
        files.sort((a, b) => {
            if (App.state.sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
            if (App.state.sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
            if (App.state.sortBy === "nameAsc") return a.name.localeCompare(b.name);
            if (App.state.sortBy === "sizeDesc") return b.size - a.size;
            if (App.state.sortBy === "sizeAsc") return a.size - b.size;
            return 0;
        });

        container.innerHTML = "";

        if (files.length === 0) {
            container.innerHTML = `
                <div class="empty-files-state">
                    <div class="empty-icon">📁</div>
                    <div class="empty-text">No files found</div>
                    <p style="color: var(--text-sub); font-size: 0.85rem;">Drop files above or choose from your device</p>
                </div>
            `;
            return;
        }

        files.forEach(file => {
            const card = document.createElement("div");
            card.className = "file-card";
            
            const encodedName = encodeURIComponent(file.name);
            const previewUrl = `/api/files/preview/${encodedName}`;
            const downloadUrl = `/api/files/download/${encodedName}`;

            let previewHtml = "";
            if (file.category === "image") {
                previewHtml = `
                    <div class="file-card-preview" onclick="UI.openPreview('${encodedName}', 'image')">
                        <img src="${previewUrl}" alt="${file.name}" loading="lazy">
                        <div class="preview-overlay-icon">👁️ Preview</div>
                    </div>
                `;
            } else if (file.category === "video") {
                previewHtml = `
                    <div class="file-card-preview" onclick="UI.openPreview('${encodedName}', 'video')">
                        <span class="file-big-icon">🎬</span>
                        <div class="preview-overlay-icon">▶ Play Video</div>
                    </div>
                `;
            } else if (file.category === "audio") {
                previewHtml = `
                    <div class="file-card-preview" onclick="UI.openPreview('${encodedName}', 'audio')">
                        <span class="file-big-icon">🎵</span>
                        <div class="preview-overlay-icon">▶ Play Audio</div>
                    </div>
                `;
            } else {
                const icon = this.getCategoryEmoji(file.category);
                previewHtml = `
                    <div class="file-card-preview" onclick="UI.openPreview('${encodedName}', '${file.category}')">
                        <span class="file-big-icon">${icon}</span>
                        <div class="preview-overlay-icon">👁️ View</div>
                    </div>
                `;
            }

            const formattedDate = new Date(file.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            card.innerHTML = `
                ${previewHtml}
                <div class="file-card-info">
                    <span class="file-title" title="${file.originalName || file.name}">${file.originalName || file.name}</span>
                    <div class="file-meta-sub">
                        <span>${file.formattedSize}</span>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                <div class="file-actions-bar">
                    <button class="file-act-btn" onclick="UI.openPreview('${encodedName}', '${file.category}')" title="Preview">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <a href="${downloadUrl}" download class="file-act-btn" title="Download">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </a>
                    <button class="file-act-btn" onclick="UI.openRenameModal('${file.name}')" title="Rename">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                    </button>
                    <button class="file-act-btn" onclick="UI.shareFileQR('${file.name}')" title="Share via QR">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </button>
                    <button class="file-act-btn delete-btn" onclick="UI.deleteFile('${file.name}')" title="Delete">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;

            container.appendChild(card);
        });
    },

    getCategoryEmoji(category) {
        switch (category) {
            case "image": return "🖼️";
            case "video": return "🎬";
            case "audio": return "🎵";
            case "document": return "📄";
            case "archive": return "📦";
            case "code": return "💻";
            default: return "📁";
        }
    },

    /* ==========================================
       MEDIA PREVIEW LIGHTBOX
    ========================================== */
    openPreview(encodedName, category) {
        const modal = document.getElementById("previewModal");
        const title = document.getElementById("previewTitle");
        const container = document.getElementById("previewContainer");
        const downloadBtn = document.getElementById("previewDownloadBtn");

        const rawName = decodeURIComponent(encodedName);
        if (title) title.textContent = rawName;
        if (downloadBtn) {
            downloadBtn.href = `/api/files/download/${encodedName}`;
            downloadBtn.download = rawName;
        }

        const previewUrl = `/api/files/preview/${encodedName}`;

        if (container) {
            if (category === "image") {
                container.innerHTML = `<img src="${previewUrl}" alt="${rawName}">`;
            } else if (category === "video") {
                container.innerHTML = `
                    <video controls autoplay playsinline style="max-height: 65vh; width: 100%;">
                        <source src="${previewUrl}" type="video/mp4">
                        Your browser does not support video playback.
                    </video>
                `;
            } else if (category === "audio") {
                container.innerHTML = `
                    <div style="text-align: center; width: 100%; padding: 30px;">
                        <div style="font-size: 3.5rem; margin-bottom: 16px;">🎵</div>
                        <h4 style="margin-bottom: 20px;">${rawName}</h4>
                        <audio controls autoplay style="width: 100%;">
                            <source src="${previewUrl}">
                            Your browser does not support audio playback.
                        </audio>
                    </div>
                `;
            } else if (["document", "code"].includes(category)) {
                container.innerHTML = `<div style="padding: 20px; color: var(--text-muted);">Loading document preview...</div>`;
                fetch(previewUrl)
                    .then(r => r.text())
                    .then(text => {
                        container.innerHTML = `<pre>${this.escapeHtml(text.slice(0, 100000))}</pre>`;
                    })
                    .catch(() => {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 40px;">
                                <div style="font-size: 3rem; margin-bottom: 12px;">📄</div>
                                <p>Preview not available for this binary format.</p>
                                <a href="${previewUrl}" download class="btn btn-primary" style="margin-top: 16px;">Download to View</a>
                            </div>
                        `;
                    });
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 3rem; margin-bottom: 12px;">📦</div>
                        <p>Direct preview not available for this file type.</p>
                        <a href="${previewUrl}" download class="btn btn-primary" style="margin-top: 16px;">Download File</a>
                    </div>
                `;
            }
        }

        if (modal) modal.style.display = "flex";
        App.playSound("pop");
    },

    escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },

    /* ==========================================
       FILE ACTIONS (DELETE, RENAME, QR SHARE)
    ========================================== */
    async deleteFile(filename) {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

        try {
            const headers = {};
            if (window.App && window.App.session && window.App.session.id) {
                headers["x-session-id"] = window.App.session.id;
                headers["x-session-token"] = window.App.session.token;
            }

            const res = await fetch(`/api/files/${encodeURIComponent(filename)}`, { method: "DELETE", headers });
            const data = await res.json();
            if (data.success) {
                App.showToast(`Deleted ${filename}`, "info");
                App.playSound("pop");
                this.loadFiles();
            } else {
                App.showToast(data.message, "error");
            }
        } catch (e) {
            App.showToast("Failed to delete file", "error");
        }
    },

    openRenameModal(filename) {
        this.currentRenameFile = filename;
        const modal = document.getElementById("renameModal");
        const input = document.getElementById("renameInput");
        if (input) {
            input.value = filename;
            setTimeout(() => input.focus(), 50);
        }
        if (modal) modal.style.display = "flex";
    },

    async confirmRename() {
        if (!this.currentRenameFile) return;
        const input = document.getElementById("renameInput");
        const newName = input ? input.value.trim() : "";
        if (!newName) return;

        try {
            const headers = { "Content-Type": "application/json" };
            if (window.App && window.App.session && window.App.session.id) {
                headers["x-session-id"] = window.App.session.id;
                headers["x-session-token"] = window.App.session.token;
            }

            const res = await fetch(`/api/files/${encodeURIComponent(this.currentRenameFile)}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ newName })
            });
            const data = await res.json();
            if (data.success) {
                App.showToast("File renamed successfully", "success");
                App.playSound("pop");
                this.closeAllModals();
                this.loadFiles();
            } else {
                App.showToast(data.message, "error");
            }
        } catch (e) {
            App.showToast("Rename failed", "error");
        }
    },

    shareFileQR(filename) {
        const fileUrl = `${window.location.origin}/api/files/download/${encodeURIComponent(filename)}`;
        const qrImage = document.getElementById("qrImage");
        const qrUrlInput = document.getElementById("qrUrlInput");
        const modal = document.getElementById("qrModal");

        if (qrUrlInput) qrUrlInput.value = fileUrl;
        
        // Generate QR on fly or fetch data
        if (qrImage) {
            qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fileUrl)}`;
        }

        if (modal) modal.style.display = "flex";
        App.playSound("pop");
    },

    /* ==========================================
       CLIPBOARD REAL-TIME HUB
    ========================================== */
    bindClipboard() {
        const sendBtn = document.getElementById("sendClipboardBtn");
        const input = document.getElementById("clipboardInput");
        const charCount = document.getElementById("charCount");

        if (input && charCount) {
            input.addEventListener("input", (e) => {
                charCount.textContent = `${e.target.value.length} characters`;
            });
        }

        if (sendBtn && input) {
            sendBtn.addEventListener("click", async () => {
                const text = input.value.trim();
                if (!text) return;

                try {
                    const hasSession = window.App && window.App.session && window.App.session.id;
                    const url = hasSession ? `/api/session/${window.App.session.id}/clipboard` : "/api/clipboard";
                    const headers = { "Content-Type": "application/json" };
                    if (hasSession) {
                        headers["x-session-token"] = window.App.session.token;
                    }

                    const res = await fetch(url, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            text,
                            sender: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        input.value = "";
                        charCount.textContent = "0 characters";
                        App.showToast("Sent to paired device!", "success");
                        App.playSound("success");
                        this.loadClipboard();
                    }
                } catch (e) {
                    App.showToast("Failed to share text", "error");
                }
            });
        }
    },

    async loadClipboard() {
        try {
            const hasSession = window.App && window.App.session && window.App.session.id;
            const url = hasSession ? `/api/session/${window.App.session.id}/clipboard` : "/api/clipboard";
            const headers = {};
            if (hasSession) {
                headers["x-session-token"] = window.App.session.token;
            }

            const res = await fetch(url, { headers });
            const data = await res.json();
            if (!data.success) return;

            const items = data.items || [];
            const badge = document.getElementById("catBadgeClip");
            if (badge) badge.textContent = items.length;

            const historyContainer = document.getElementById("clipboardHistory");
            if (!historyContainer) return;

            historyContainer.innerHTML = "";

            if (items.length === 0) {
                historyContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-sub);">
                        <p>No shared clipboard items yet.</p>
                        <p style="font-size: 0.8rem; margin-top: 4px;">Paste any text, OTP, or link above to sync across paired devices!</p>
                    </div>
                `;
                return;
            }

            items.forEach(item => {
                const itemEl = document.createElement("div");
                itemEl.className = "clip-item";
                const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                itemEl.innerHTML = `
                    <div class="clip-content">
                        <div class="clip-text">${this.escapeHtml(item.text)}</div>
                        <div class="clip-meta">${item.sender} • ${timeStr}</div>
                    </div>
                    <div class="clip-actions">
                        <button class="btn btn-secondary btn-sm" onclick="App.copyToClipboard('${encodeURIComponent(item.text)}', 'Copied text!')">
                            Copy
                        </button>
                        <button class="file-act-btn delete-btn" onclick="UI.deleteClipboardItem('${item.id}')">
                            🗑️
                        </button>
                    </div>
                `;
                historyContainer.appendChild(itemEl);
            });
        } catch (err) {
            console.error("Load clipboard error:", err);
        }
    },

    async deleteClipboardItem(id) {
        try {
            const hasSession = window.App && window.App.session && window.App.session.id;
            const url = hasSession ? `/api/session/${window.App.session.id}/clipboard/${id}` : `/api/clipboard/${id}`;
            const headers = {};
            if (hasSession) {
                headers["x-session-token"] = window.App.session.token;
            }

            await fetch(url, { method: "DELETE", headers });
            this.loadClipboard();
        } catch (e) {}
    },

    /* ==========================================
       MODALS & MOBILE NAV
    ========================================== */
    bindModals() {
        const qrBtn = document.getElementById("qrBtn");
        const qrModal = document.getElementById("qrModal");
        const closeQrModal = document.getElementById("closeQrModal");
        const copyQrUrlBtn = document.getElementById("copyQrUrlBtn");
        const qrUrlInput = document.getElementById("qrUrlInput");

        const previewModal = document.getElementById("previewModal");
        const closePreviewModal = document.getElementById("closePreviewModal");

        const renameModal = document.getElementById("renameModal");
        const closeRenameModal = document.getElementById("closeRenameModal");
        const cancelRenameBtn = document.getElementById("cancelRenameBtn");
        const confirmRenameBtn = document.getElementById("confirmRenameBtn");

        if (qrBtn && qrModal) {
            qrBtn.addEventListener("click", () => {
                App.fetchNetworkInfo();
                qrModal.style.display = "flex";
                App.playSound("pop");
            });
        }
        if (closeQrModal && qrModal) {
            closeQrModal.addEventListener("click", () => qrModal.style.display = "none");
        }
        if (copyQrUrlBtn && qrUrlInput) {
            copyQrUrlBtn.addEventListener("click", () => {
                App.copyToClipboard(qrUrlInput.value, "URL copied! Paste in phone browser");
            });
        }

        if (closePreviewModal && previewModal) {
            closePreviewModal.addEventListener("click", () => {
                previewModal.style.display = "none";
                const container = document.getElementById("previewContainer");
                if (container) container.innerHTML = ""; // Stop video/audio playback
            });
        }

        if (closeRenameModal && renameModal) {
            closeRenameModal.addEventListener("click", () => renameModal.style.display = "none");
        }
        if (cancelRenameBtn && renameModal) {
            cancelRenameBtn.addEventListener("click", () => renameModal.style.display = "none");
        }
        if (confirmRenameBtn) {
            confirmRenameBtn.addEventListener("click", () => this.confirmRename());
        }

        // Close on backdrop click
        [qrModal, previewModal, renameModal].forEach(m => {
            if (m) {
                m.addEventListener("click", (e) => {
                    if (e.target === m) this.closeAllModals();
                });
            }
        });
    },

    closeAllModals() {
        ["qrModal", "previewModal", "renameModal"].forEach(id => {
            const m = document.getElementById(id);
            if (m) m.style.display = "none";
        });
        const previewContainer = document.getElementById("previewContainer");
        if (previewContainer) previewContainer.innerHTML = "";
    },

    bindMobileNav() {
        const mobNavTransfer = document.getElementById("mobNavTransfer");
        const mobNavFiles = document.getElementById("mobNavFiles");
        const mobNavClipboard = document.getElementById("mobNavClipboard");
        const mobNavQR = document.getElementById("mobNavQR");

        const activateMobBtn = (btn) => {
            document.querySelectorAll(".mob-nav-btn").forEach(b => b.classList.remove("active"));
            if (btn) btn.classList.add("active");
        };

        if (mobNavTransfer) {
            mobNavTransfer.addEventListener("click", () => {
                activateMobBtn(mobNavTransfer);
                const dropZone = document.getElementById("dropZone");
                if (dropZone) dropZone.scrollIntoView({ behavior: "smooth" });
                App.playSound("pop");
            });
        }

        if (mobNavFiles) {
            mobNavFiles.addEventListener("click", () => {
                activateMobBtn(mobNavFiles);
                const tab = document.querySelector(".tab-btn[data-cat='all']");
                if (tab) tab.click();
                const explorer = document.querySelector(".explorer-section");
                if (explorer) explorer.scrollIntoView({ behavior: "smooth" });
                App.playSound("pop");
            });
        }

        if (mobNavClipboard) {
            mobNavClipboard.addEventListener("click", () => {
                activateMobBtn(mobNavClipboard);
                const tab = document.querySelector(".tab-btn[data-cat='clipboard']");
                if (tab) tab.click();
                const explorer = document.querySelector(".explorer-section");
                if (explorer) explorer.scrollIntoView({ behavior: "smooth" });
                App.playSound("pop");
            });
        }

        const mobNavDisconnect = document.getElementById("mobNavDisconnect");
        if (mobNavDisconnect) {
            mobNavDisconnect.addEventListener("click", () => {
                if (window.App && typeof App.promptEndSession === "function") {
                    App.promptEndSession();
                }
            });
        }
    }
};

window.addEventListener("DOMContentLoaded", () => {
    UI.init();
});

window.UI = UI;