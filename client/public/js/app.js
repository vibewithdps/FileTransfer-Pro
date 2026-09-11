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

    session: {
        id: null,
        pin: null,
        token: null,
        role: null, // 'host' | 'client'
        status: "unpaired", // 'waiting' | 'paired' | 'unpaired'
        peerName: null
    },

    init() {
        this.initTheme();
        this.initSound();
        this.initPWA();
        this.initShortcuts();
        this.fetchNetworkInfo();
        this.initSession();
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
    },

    /* ==========================================
       PRIVATE QR-PAIRED SESSION ENGINE
    ========================================== */
    initSession() {
        this.bindGatewayControls();

        // Check if device is joining via QR scan URL query params (?join=ID&token=TOKEN)
        const urlParams = new URLSearchParams(window.location.search);
        const joinId = urlParams.get("join");
        const joinToken = urlParams.get("token");

        if (joinId && joinToken) {
            this.joinSessionWithToken(joinId, joinToken);
            return;
        }

        // Check if there was an existing active session in this browser tab
        const savedSession = sessionStorage.getItem("ft_session");
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed && parsed.id && parsed.token) {
                    this.restoreExistingSession(parsed);
                    return;
                }
            } catch (e) {}
        }

        // Default: Host device creates a fresh pairing session
        this.createNewSession();
    },

    bindGatewayControls() {
        const tabShowQr = document.getElementById("tabShowQr");
        const tabEnterPin = document.getElementById("tabEnterPin");
        const qrView = document.getElementById("gatewayQrView");
        const pinView = document.getElementById("gatewayPinView");
        const copyPinBtn = document.getElementById("copyPinBtn");
        const copyPairingLinkBtn = document.getElementById("copyPairingLinkBtn");
        const joinWithPinBtn = document.getElementById("joinWithPinBtn");
        const clientPinInput = document.getElementById("clientPinInput");
        const headerEndSessionBtn = document.getElementById("headerEndSessionBtn");
        const bannerEndSessionBtn = document.getElementById("bannerEndSessionBtn");

        // Tabs Toggle: Show QR vs Enter PIN
        if (tabShowQr && tabEnterPin && qrView && pinView) {
            tabShowQr.addEventListener("click", () => {
                tabShowQr.classList.add("active");
                tabEnterPin.classList.remove("active");
                qrView.style.display = "block";
                pinView.style.display = "none";
                this.playSound("pop");
            });

            tabEnterPin.addEventListener("click", () => {
                tabEnterPin.classList.add("active");
                tabShowQr.classList.remove("active");
                qrView.style.display = "none";
                pinView.style.display = "block";
                if (clientPinInput) setTimeout(() => clientPinInput.focus(), 100);
                this.playSound("pop");
            });
        }

        // Copy PIN button
        if (copyPinBtn) {
            copyPinBtn.addEventListener("click", () => {
                const pinDisplay = document.getElementById("pairingPinDisplay");
                if (pinDisplay && pinDisplay.textContent !== "------") {
                    this.copyToClipboard(pinDisplay.textContent, `6-Digit PIN ${pinDisplay.textContent} copied!`);
                }
            });
        }

        // Copy direct pairing link button
        if (copyPairingLinkBtn) {
            copyPairingLinkBtn.addEventListener("click", () => {
                const linkInput = document.getElementById("pairingLinkInput");
                if (linkInput && linkInput.value) {
                    this.copyToClipboard(linkInput.value, "Pairing link copied! Open on your phone.");
                }
            });
        }

        // Join with PIN button
        if (joinWithPinBtn && clientPinInput) {
            joinWithPinBtn.addEventListener("click", () => {
                this.joinSessionWithPin(clientPinInput.value.trim());
            });

            clientPinInput.addEventListener("keyup", (e) => {
                if (e.key === "Enter") {
                    this.joinSessionWithPin(clientPinInput.value.trim());
                }
            });
        }

        // End session triggers
        if (headerEndSessionBtn) {
            headerEndSessionBtn.addEventListener("click", () => this.promptEndSession());
        }
        if (bannerEndSessionBtn) {
            bannerEndSessionBtn.addEventListener("click", () => this.promptEndSession());
        }
    },

    async createNewSession() {
        try {
            const loader = document.getElementById("qrLoaderOverlay");
            if (loader) loader.style.display = "flex";

            const res = await fetch("/api/session/create", { method: "POST" });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            const session = data.session;
            this.session = {
                id: session.id,
                pin: session.pin,
                token: session.token,
                role: "host",
                status: "waiting",
                peerName: null
            };

            sessionStorage.setItem("ft_session", JSON.stringify(this.session));

            // Populate QR & PIN UI
            const qrImg = document.getElementById("pairingQrImage");
            if (qrImg) qrImg.src = session.qrCodeDataUrl;

            const pinDisplay = document.getElementById("pairingPinDisplay");
            if (pinDisplay) pinDisplay.textContent = session.pin;

            const linkInput = document.getElementById("pairingLinkInput");
            if (linkInput) linkInput.value = session.joinUrl;

            const beaconText = document.getElementById("beaconStatusText");
            if (beaconText) beaconText.textContent = "Waiting for connection... Point your camera at the QR code";

            if (loader) loader.style.display = "none";

            // Join private socket room as host
            if (window.Socket) {
                Socket.joinSession(session.id, session.token, "host", "Host Device");
            }
        } catch (err) {
            console.error("Create session error:", err);
            const beaconText = document.getElementById("beaconStatusText");
            if (beaconText) beaconText.textContent = "Failed to generate pairing session. Please refresh.";
        }
    },

    async restoreExistingSession(saved) {
        try {
            const res = await fetch(`/api/session/${saved.id}/status`);
            const data = await res.json();

            if (data.success && data.status !== "ended") {
                this.session = saved;
                if (window.Socket) {
                    Socket.joinSession(saved.id, saved.token, saved.role || "host");
                }

                if (data.status === "paired") {
                    this.session.status = "paired";
                    const peerName = saved.role === "host"
                        ? (data.client ? data.client.name : "Mobile Device")
                        : (data.host ? data.host.name : "Host Device");
                    this.unlockWorkspace(peerName);
                } else {
                    // Session is waiting for connection, refresh host view
                    this.session.status = "waiting";
                    const pinDisplay = document.getElementById("pairingPinDisplay");
                    if (pinDisplay && saved.pin) pinDisplay.textContent = saved.pin;
                }
                return;
            }
        } catch (e) {}

        // If session was invalid or expired, generate a clean one
        sessionStorage.removeItem("ft_session");
        this.createNewSession();
    },

    async joinSessionWithToken(sessionId, token) {
        try {
            const beaconText = document.getElementById("beaconStatusText");
            if (beaconText) beaconText.textContent = "Connecting to private session...";

            const res = await fetch("/api/session/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, token })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            const hostName = data.session.host ? data.session.host.name : "Host Device";
            this.session = {
                id: data.session.id,
                token: data.session.token,
                pin: null,
                role: "client",
                status: "paired",
                peerName: hostName
            };

            sessionStorage.setItem("ft_session", JSON.stringify(this.session));

            // Clean URL query params without reloading page
            window.history.replaceState({}, document.title, window.location.pathname);

            if (window.Socket) {
                Socket.joinSession(data.session.id, data.session.token, "client", "Mobile Device");
            }

            this.unlockWorkspace(hostName);
            this.showToast("🎉 Paired with Host! Data transfer unlocked.", "success");
            this.playSound("success");
        } catch (err) {
            console.error("Join session error:", err);
            this.showToast(err.message || "Failed to pair with session", "error");
            window.history.replaceState({}, document.title, window.location.pathname);
            this.createNewSession();
        }
    },

    async joinSessionWithPin(pin) {
        const errorMsg = document.getElementById("pinErrorMsg");
        if (errorMsg) errorMsg.style.display = "none";

        const cleanPin = (pin || "").replace(/\s|-/g, "");
        if (cleanPin.length !== 6) {
            if (errorMsg) {
                errorMsg.textContent = "Please enter a valid 6-digit PIN code";
                errorMsg.style.display = "block";
            }
            return;
        }

        try {
            const btn = document.getElementById("joinWithPinBtn");
            if (btn) btn.disabled = true;

            const res = await fetch("/api/session/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: cleanPin })
            });
            const data = await res.json();
            if (btn) btn.disabled = false;

            if (!data.success) {
                if (errorMsg) {
                    errorMsg.textContent = data.message || "Invalid or expired PIN code";
                    errorMsg.style.display = "block";
                }
                return;
            }

            const hostName = data.session.host ? data.session.host.name : "Host Device";
            this.session = {
                id: data.session.id,
                token: data.session.token,
                pin: cleanPin,
                role: "client",
                status: "paired",
                peerName: hostName
            };

            sessionStorage.setItem("ft_session", JSON.stringify(this.session));

            if (window.Socket) {
                Socket.joinSession(data.session.id, data.session.token, "client", "Client Device");
            }

            this.unlockWorkspace(hostName);
            this.showToast("🎉 Paired successfully! Transfer unlocked.", "success");
            this.playSound("success");
        } catch (err) {
            const btn = document.getElementById("joinWithPinBtn");
            if (btn) btn.disabled = false;
            if (errorMsg) {
                errorMsg.textContent = "Network error. Could not connect.";
                errorMsg.style.display = "block";
            }
        }
    },

    onSessionPaired(data) {
        if (!this.session) return;
        this.session.status = "paired";

        let peerName = "Paired Device";
        if (this.session.role === "host") {
            peerName = (data.client && data.client.name) ? data.client.name : "Mobile Device";
        } else {
            peerName = (data.host && data.host.name) ? data.host.name : "Host Device";
        }
        this.session.peerName = peerName;
        sessionStorage.setItem("ft_session", JSON.stringify(this.session));

        this.unlockWorkspace(peerName);
        this.showToast(`🎉 Connected to ${peerName}! Transfer unlocked.`, "success");
        this.playSound("success");
    },

    unlockWorkspace(peerName) {
        const gateway = document.getElementById("pairingGateway");
        const workspace = document.getElementById("transferWorkspace");
        const statusPill = document.getElementById("statusPill");
        const statusText = document.getElementById("statusText");
        const sessionBadge = document.getElementById("sessionBadge");
        const headerPin = document.getElementById("sessionHeaderPin");
        const headerEndBtn = document.getElementById("headerEndSessionBtn");
        const pairedWithText = document.getElementById("pairedWithText");
        const mobNav = document.getElementById("mobileBottomNav");

        if (gateway) gateway.style.display = "none";
        if (workspace) workspace.style.display = "block";

        if (statusPill) statusPill.className = "status-pill paired";
        if (statusText) statusText.textContent = "🔒 Paired & Private";

        if (sessionBadge && this.session && this.session.pin) {
            sessionBadge.style.display = "inline-flex";
            if (headerPin) headerPin.textContent = this.session.pin;
        }

        if (headerEndBtn) headerEndBtn.style.display = "inline-flex";
        if (pairedWithText && peerName) pairedWithText.textContent = `Connected with: ${peerName}`;

        if (mobNav && window.innerWidth <= 768) {
            mobNav.style.display = "flex";
        }

        if (window.UI) {
            UI.loadFiles();
            UI.loadClipboard();
        }
    },

    lockWorkspace() {
        const gateway = document.getElementById("pairingGateway");
        const workspace = document.getElementById("transferWorkspace");
        const statusPill = document.getElementById("statusPill");
        const statusText = document.getElementById("statusText");
        const sessionBadge = document.getElementById("sessionBadge");
        const headerEndBtn = document.getElementById("headerEndSessionBtn");
        const mobNav = document.getElementById("mobileBottomNav");

        if (workspace) workspace.style.display = "none";
        if (mobNav) mobNav.style.display = "none";
        if (gateway) gateway.style.display = "block";

        if (statusPill) statusPill.className = "status-pill waiting";
        if (statusText) statusText.textContent = "Scan QR to Connect";
        if (sessionBadge) sessionBadge.style.display = "none";
        if (headerEndBtn) headerEndBtn.style.display = "none";

        if (window.UI) {
            UI.allFiles = [];
            UI.renderFiles();
            const clipHistory = document.getElementById("clipboardHistory");
            if (clipHistory) clipHistory.innerHTML = "";
        }
    },

    promptEndSession() {
        if (confirm("End this private session? All files and clipboard data transferred during this session will be locked and cleared.")) {
            this.endSession();
        }
    },

    async endSession() {
        if (!this.session || !this.session.id) return;

        try {
            await fetch(`/api/session/${this.session.id}/end`, {
                method: "POST",
                headers: { "x-session-token": this.session.token }
            });
        } catch (e) {}

        sessionStorage.removeItem("ft_session");
        this.session = { id: null, pin: null, token: null, role: null, status: "unpaired", peerName: null };
        this.lockWorkspace();
        this.createNewSession();
        this.showToast("Private session ended. Data locked.", "info");
        this.playSound("pop");
    },

    onSessionEnded(data) {
        sessionStorage.removeItem("ft_session");
        this.session = { id: null, pin: null, token: null, role: null, status: "unpaired", peerName: null };
        this.lockWorkspace();
        this.createNewSession();
        this.showToast((data && data.message) || "Peer ended the private session.", "info");
        this.playSound("pop");
    }
};

window.addEventListener("DOMContentLoaded", () => {
    App.init();
});

window.App = App;