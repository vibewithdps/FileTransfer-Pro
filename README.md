# 🚀 FileTransfer Pro v2
### High-Speed Cross-Platform LAN File & Text Transfer Hub
Supports: **Windows • macOS • Linux • Android • iPhone / iPad • Tablets**

---

## ✨ Features

- ⚡ **Zero-Config Offline-Ready**: Works 100% offline on any local Wi-Fi router or mobile hotspot without internet or cloud dependencies.
- 📱 **Instant Mobile QR Connect**: Scan the terminal ASCII QR code or the web UI QR code with your iPhone or Android camera to connect immediately without installing any app.
- 📲 **Progressive Web App (PWA)**: Installable on Android (Chrome/Firefox), iOS (Safari "Add to Home Screen"), macOS, and Windows with offline caching.
- 🎨 **Ultra-Modern Glassmorphism UI**: 
  - Futuristic dark theme, clean light theme, and true pitch-black AMOLED mode.
  - Multi-file drag-and-drop zone with animated glowing radar effects.
  - Real-time upload queue with live transfer speed (`MB/s`), ETA countdown, and progress bars.
  - Visual multi-color storage distribution gauge.
- 📋 **Cross-Device Clipboard Sharing**: Send text notes, links, passwords, or OTPs instantly across your phone and PC with 1-click copy.
- 👁️ **In-App Media Player & Lightbox**: Fullscreen photo preview, inline MP4/WebM video playback with seekable controls, and audio player.
- 🔄 **Real-Time WebSockets**: Instant updates via Socket.IO across all connected devices when files are uploaded, renamed, or deleted.
- 📸 **Mobile Camera & Gallery Upload**: Tap to take photos or record videos directly from your smartphone and send them straight to your PC.

---

## 🚀 How to Run

### 🍏 On macOS
Double-click:
```bash
./start.command
```
*Or via terminal:*
```bash
npm start
```

### 🪟 On Windows
Double-click:
```bat
start.bat
```
*Or:*
```bat
Filetransfer.bat
```

### 🐧 On Linux
```bash
./start.sh
```

---

## 📱 How to Connect from Mobile (Android / iPhone / iPad)

1. Connect your phone or tablet to the **same Wi-Fi or Hotspot** as your computer.
2. Open your phone's camera and **point it at the QR code** on your computer's screen (or in the terminal).
3. Tap the link that appears (e.g. `http://192.168.1.15:5000`).
4. **Done!** You can now upload photos, videos, and files to your PC, download files to your phone, and copy-paste text between devices.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Socket.IO, Multer, QRCode, Compression, Helmet.
- **Frontend**: Vanilla ES6+, HTML5 Drag & Drop, CSS3 Glassmorphism, Web Audio API, Service Worker (PWA).
- **Storage**: High-speed local filesystem store with non-blocking metadata caching and optional MongoDB sync.