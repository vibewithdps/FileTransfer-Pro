/*
==========================================================
    FileTransfer Pro v2
    High-Speed Upload & Transfer Rate Calculator
==========================================================
*/

"use strict";

const Uploader = {
    activeUploads: new Map(), // id -> { xhr, file, startTime, lastLoaded, lastTime }

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const dropZone = document.getElementById("dropZone");
        const fileInput = document.getElementById("fileInput");
        const folderInput = document.getElementById("folderInput");
        const cameraInput = document.getElementById("cameraInput");

        const selectFilesBtn = document.getElementById("selectFilesBtn");
        const selectFolderBtn = document.getElementById("selectFolderBtn");
        const cameraBtn = document.getElementById("cameraBtn");
        const cancelAllBtn = document.getElementById("cancelAllUploadsBtn");

        // Button Triggers
        if (selectFilesBtn && fileInput) {
            selectFilesBtn.addEventListener("click", () => fileInput.click());
        }
        if (selectFolderBtn && folderInput) {
            selectFolderBtn.addEventListener("click", () => folderInput.click());
        }
        if (cameraBtn && cameraInput) {
            cameraBtn.addEventListener("click", () => cameraInput.click());
        }

        // File Inputs Change
        if (fileInput) {
            fileInput.addEventListener("change", (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFiles(e.target.files);
                    fileInput.value = "";
                }
            });
        }
        if (folderInput) {
            folderInput.addEventListener("change", (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFiles(e.target.files);
                    folderInput.value = "";
                }
            });
        }
        if (cameraInput) {
            cameraInput.addEventListener("change", (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFiles(e.target.files);
                    cameraInput.value = "";
                }
            });
        }

        // Drag & Drop
        if (dropZone) {
            ["dragenter", "dragover"].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.add("dragover");
                });
            });

            ["dragleave", "drop"].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.remove("dragover");
                });
            });

            dropZone.addEventListener("drop", (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    this.handleFiles(dt.files);
                }
            });
        }

        // Cancel All
        if (cancelAllBtn) {
            cancelAllBtn.addEventListener("click", () => this.cancelAll());
        }
    },

    handleFiles(fileList) {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        App.showToast(`Starting upload for ${files.length} ${files.length === 1 ? 'file' : 'files'}...`);

        files.forEach(file => {
            this.uploadSingleFile(file);
        });
    },

    uploadSingleFile(file) {
        const uploadId = "up_" + Math.random().toString(36).substr(2, 9);
        const formData = new FormData();
        formData.append("files", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload", true);
        xhr.setRequestHeader("x-client-device", navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Computer");

        const uploadObj = {
            id: uploadId,
            xhr,
            file,
            startTime: Date.now(),
            lastLoaded: 0,
            lastTime: Date.now(),
            speed: 0
        };

        this.activeUploads.set(uploadId, uploadObj);
        this.renderUploadDrawer();

        xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable) return;

            const now = Date.now();
            const timeDiff = (now - uploadObj.lastTime) / 1000;

            if (timeDiff >= 0.4 || e.loaded === e.total) {
                const bytesDiff = e.loaded - uploadObj.lastLoaded;
                uploadObj.speed = timeDiff > 0 ? (bytesDiff / timeDiff) : 0;
                uploadObj.lastLoaded = e.loaded;
                uploadObj.lastTime = now;
            }

            const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
            const remainingBytes = e.total - e.loaded;
            const etaSeconds = uploadObj.speed > 0 ? Math.round(remainingBytes / uploadObj.speed) : 0;

            this.updateUploadCard(uploadId, percent, uploadObj.speed, etaSeconds);
            this.updateOverallSpeed();
        };

        xhr.onload = () => {
            this.activeUploads.delete(uploadId);
            this.renderUploadDrawer();
            this.updateOverallSpeed();

            if (xhr.status >= 200 && xhr.status < 300) {
                App.showToast(`✅ ${file.name} uploaded successfully!`, "success");
                App.playSound("success");
                if (window.UI) UI.loadFiles();
            } else {
                App.showToast(`❌ Failed to upload ${file.name}`, "error");
                App.playSound("error");
            }
        };

        xhr.onerror = () => {
            this.activeUploads.delete(uploadId);
            this.renderUploadDrawer();
            this.updateOverallSpeed();
            App.showToast(`Network error during ${file.name} upload`, "error");
            App.playSound("error");
        };

        xhr.send(formData);
    },

    cancelUpload(uploadId) {
        const item = this.activeUploads.get(uploadId);
        if (item && item.xhr) {
            item.xhr.abort();
            this.activeUploads.delete(uploadId);
            this.renderUploadDrawer();
            this.updateOverallSpeed();
            App.showToast(`Upload cancelled: ${item.file.name}`, "warning");
        }
    },

    cancelAll() {
        this.activeUploads.forEach((item) => {
            if (item.xhr) item.xhr.abort();
        });
        this.activeUploads.clear();
        this.renderUploadDrawer();
        this.updateOverallSpeed();
        App.showToast("All active uploads cancelled", "warning");
    },

    formatSpeed(bytesPerSec) {
        if (!bytesPerSec || bytesPerSec < 0) return "0 KB/s";
        if (bytesPerSec >= 1024 * 1024) {
            return (bytesPerSec / (1024 * 1024)).toFixed(1) + " MB/s";
        }
        return (bytesPerSec / 1024).toFixed(0) + " KB/s";
    },

    formatEta(seconds) {
        if (!seconds || seconds <= 0) return "calculating...";
        if (seconds < 60) return `${seconds}s left`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s left`;
    },

    renderUploadDrawer() {
        const section = document.getElementById("activeUploadsSection");
        const list = document.getElementById("activeUploadsList");
        const count = document.getElementById("activeUploadCount");

        const totalActive = this.activeUploads.size;
        if (!section || !list) return;

        if (totalActive === 0) {
            section.style.display = "none";
            list.innerHTML = "";
            return;
        }

        section.style.display = "flex";
        if (count) count.textContent = totalActive;

        // Build list if cards not yet in DOM
        this.activeUploads.forEach((item, id) => {
            if (!document.getElementById(`uploadCard_${id}`)) {
                const card = document.createElement("div");
                card.className = "upload-item-card";
                card.id = `uploadCard_${id}`;
                card.innerHTML = `
                    <div class="upload-item-meta">
                        <span class="upload-filename" title="${item.file.name}">${item.file.name}</span>
                        <span class="upload-speed-eta" id="speedEta_${id}">Starting...</span>
                        <button class="file-act-btn delete-btn" onclick="Uploader.cancelUpload('${id}')" title="Cancel upload">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="upload-progress-bar">
                        <div class="upload-progress-fill" id="progressFill_${id}" style="width: 0%"></div>
                    </div>
                `;
                list.appendChild(card);
            }
        });

        // Clean up completed cards
        const existingCards = list.querySelectorAll(".upload-item-card");
        existingCards.forEach(c => {
            const id = c.id.replace("uploadCard_", "");
            if (!this.activeUploads.has(id)) {
                c.remove();
            }
        });
    },

    updateUploadCard(id, percent, speed, eta) {
        const fill = document.getElementById(`progressFill_${id}`);
        const speedEta = document.getElementById(`speedEta_${id}`);

        if (fill) fill.style.width = `${percent}%`;
        if (speedEta) {
            speedEta.textContent = `${percent}% • ${this.formatSpeed(speed)} • ${this.formatEta(eta)}`;
        }
    },

    updateOverallSpeed() {
        let totalSpeed = 0;
        this.activeUploads.forEach(item => {
            totalSpeed += (item.speed || 0);
        });

        const speedEl = document.getElementById("activeSpeed");
        if (speedEl) {
            speedEl.textContent = this.formatSpeed(totalSpeed);
        }
    }
};

window.addEventListener("DOMContentLoaded", () => {
    Uploader.init();
});

window.Uploader = Uploader;