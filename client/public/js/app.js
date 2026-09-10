/*
==========================================================
    FileTransfer Pro v2
    Main Application State & Network Coordinator
==========================================================
*/

"use strict";

const App = {
    state: {
        theme: localStorage.getItem("ft_theme") || "dark",
        soundEnabled: localStorage.getItem("ft_sound") !== "false",
        network: null,
        deferredInstallPrompt: null,
        activeCategory: "all",
        searchQuery: "",
        sortBy: "newest",
        viewMode: localStorage.getItem("ft_view") || "grid"
    },

    init() {
        this.initTheme();
        this.initSound();
        this.initPWA();
        this.initShortcuts();
        this.fetchNetworkInfo();
    },

    /* ==========================================
       THEME CONTROLLER
    ========================================== */
    initTheme() {
        const body = document.body;
        body.classList.remove("dark-theme", "light-theme", "oled-theme");
        body.classList.add(`${this.state.theme}-theme`);

        const themeIcon = document.getElementById("themeIcon");
        if (themeIcon) {
            themeIcon.textContent = this.state.theme === "light" ? "☀️" : (this.state.theme === "oled" ? "🕶️" : "🌙");
        }

        const themeBtn = document.getElementById("themeToggle");
        if (themeBtn) {
            themeBtn.addEventListener("click", () => this.cycleTheme());
        }
    },

    cycleTheme() {
        const themes = ["dark", "light", "oled"];
        const nextIdx = (themes.indexOf(this.state.theme) + 1) % themes.length;
        this.state.theme = themes[nextIdx];
        localStorage.setItem("ft_theme", this.state.theme);
        this.initTheme();
        this.showToast(`Theme switched to ${this.state.theme.toUpperCase()}`);
        this.playSound("pop");
    },

    /* ==========================================
       SYNTHESIZED SOUND EFFECTS (Web Audio API)
    ========================================== */
    initSound() {
        const soundBtn = document.getElementById("soundToggle");
        const soundIcon = document.getElementById("soundIcon");

        const updateSoundUI = () => {
            if (soundIcon) soundIcon.textContent = this.state.soundEnabled ? "🔔" : "🔕";
        };

        if (soundBtn) {
            soundBtn.addEventListener("click", () => {
                this.state.soundEnabled = !this.state.soundEnabled;
                localStorage.setItem("ft_sound", this.state.soundEnabled);
                updateSoundUI();
                this.showToast(this.state.soundEnabled ? "Sound enabled" : "Sound muted");
                if (this.state.soundEnabled) this.playSound("pop");
            });
        }
        updateSoundUI();
    },

    playSound(type = "success") {
        if (!this.state.soundEnabled) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const now = ctx.currentTime;

            if (type === "success") {
                // Two-tone rising melodic chime
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = "sine";
                osc2.type = "sine";
                osc1.frequency.setValueAtTime(523.25, now); // C5
                osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5

                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start(now);
                osc1.stop(now + 0.1);
                osc2.start(now + 0.08);
                osc2.stop(now + 0.4);
            } else if (type === "pop") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);

                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
            } else if (type === "error") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(196, now + 0.1);

                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            // Audio context not allowed without interaction
        }
    },

    /* ==========================================
       PWA INSTALLATION & SERVICE WORKER
    ========================================== */
    initPWA() {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker.register("/sw.js").catch(() => {});
            });
        }

        const pwaBtn = document.getElementById("pwaInstallBtn");
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            this.state.deferredInstallPrompt = e;
            if (pwaBtn) pwaBtn.style.display = "inline-flex";
        });

        if (pwaBtn) {
            pwaBtn.addEventListener("click", async () => {
                if (this.state.deferredInstallPrompt) {
                    this.state.deferredInstallPrompt.prompt();
                    const { outcome } = await this.state.deferredInstallPrompt.userChoice;
                    if (outcome === "accepted") {
                        pwaBtn.style.display = "none";
                        this.showToast("App installation started!");
                    }
                    this.state.deferredInstallPrompt = null;
                }
            });
        }
    },

    /* ==========================================
       NETWORK DISCOVERY & QR CODE
    ========================================== */
    async fetchNetworkInfo() {
        try {
            const res = await fetch("/api/network");
            const data = await res.json();
            if (data.success) {
                this.state.network = data;
                
                // Update header host address
                const hostEl = document.getElementById("hostAddress");
                if (hostEl) {
                    hostEl.textContent = `${data.primaryIp}:${data.port}`;
                }

                // Update QR code modal elements
                const qrImage = document.getElementById("qrImage");
                if (qrImage && data.qrCodeDataUrl) {
                    qrImage.src = data.qrCodeDataUrl;
                }

                const qrUrlInput = document.getElementById("qrUrlInput");
                if (qrUrlInput) {
                    qrUrlInput.value = data.serverUrl;
                }

                // Render other interfaces if any
                const ifacesList = document.getElementById("qrInterfacesList");
                if (ifacesList && data.interfaces) {
                    ifacesList.innerHTML = data.interfaces.map(i => `
                        <div class="qr-iface-item">
                            <span>📡 ${i.name.toUpperCase()} (${i.type}):</span>
                            <a href="${i.url}" target="_blank">${i.url}</a>
                        </div>
                    `).join("");
                }
            }
        } catch (err) {
            console.warn("Network discovery fetch failed:", err.message);
        }
    },

    /* ==========================================
       CLIPBOARD HELPER
    ========================================== */
    async copyToClipboard(text, successMsg = "Copied to clipboard!") {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand("copy");
                ta.remove();
            }
            this.showToast(successMsg, "success");
            this.playSound("pop");
        } catch (e) {
            this.showToast("Failed to copy", "error");
        }
    },

    /* ==========================================
       TOAST NOTIFICATIONS
    ========================================== */
    showToast(message, type = "info") {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        let icon = "ℹ️";
        if (type === "success") icon = "✅";
        if (type === "error") icon = "❌";
        if (type === "warning") icon = "⚠️";

        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(50px)";
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    },

    /* ==========================================
       KEYBOARD SHORTCUTS
    ========================================== */
    initShortcuts() {
        document.addEventListener("keydown", (e) => {
            // Ignore if inside input/textarea
            if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
                if (e.key === "Escape") {
                    document.activeElement.blur();
                    UI.closeAllModals();
                }
                return;
            }

            // Ctrl/Cmd + U -> Open file dialog
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
                e.preventDefault();
                const fileInput = document.getElementById("fileInput");
                if (fileInput) fileInput.click();
            }

            // Press / -> Focus search
            if (e.key === "/") {
                e.preventDefault();
                const search = document.getElementById("searchInput");
                if (search) search.focus();
            }

            // Escape -> Close modals
            if (e.key === "Escape") {
                UI.closeAllModals();
            }
        });
    }
};

window.addEventListener("DOMContentLoaded", () => {
    App.init();
});

window.App = App;