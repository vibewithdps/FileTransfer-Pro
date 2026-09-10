const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, file.originalname) 
});
const upload = multer({ storage: storage });

app.use('/download', express.static(uploadDir));

app.get('/', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        let fileLinks = '';
        
        if (!err && files && files.length > 0) {
            files.forEach(file => {
                if (file !== '.DS_Store' && file !== 'desktop.ini') {
                    fileLinks += `<li><a href="/download/${encodeURIComponent(file)}" download>${file}</a></li>`;
                }
            });
        }
        
        if (fileLinks === '') {
            fileLinks = '<p style="color: #888; font-style: italic;">No files found in PC folder.</p>';
        }

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Personal LAN Transfer with DPS</title>
                <style>
                    body { font-family: system-ui, sans-serif; text-align: center; padding: 20px; background: #f0f2f5; color: #333; }
                    .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); max-width: 400px; margin: 20px auto; text-align: left; }
                    h2 { margin-top: 0; color: #1a73e8; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
                    input[type="file"] { margin: 15px 0; width: 100%; }
                    button { background: #1a73e8; color: white; border: none; border-radius: 6px; padding: 12px; font-size: 16px; font-weight: bold; width: 100%; cursor: pointer; }
                    ul { padding-left: 20px; word-break: break-all; }
                    li { margin: 12px 0; font-size: 16px; }
                    li a { color: #1a73e8; font-weight: bold; text-decoration: none; }
                    .refresh-btn { background: #5f6368; font-size: 12px; padding: 6px; width: auto; display: inline-block; margin-bottom: 10px;}
                </style>
            </head>
            <body>
                <h1>🏫 Personal File Center</h1>
                
                <div class="card">
                    <h2>📤 Upload From Mobile</h2>
                    <form action="/upload" method="POST" enctype="multipart/form-data">
                        <input type="file" name="assignment" required>
                        <button type="submit">Upload To PC/Laptop</button>
                    </form>
                </div>

                <div class="card">
                    <h2>📥 Available Files on PC/Laptop</h2>
                    <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh List</button>
                    <ul>${fileLinks}</ul>
                </div>
            <footer style="text-align:center;padding:20px;color:#666">Created By DPS</footer></body>
            </html>
        `);
    });
});

app.post('/upload', upload.single('assignment'), (req, res) => {
    if (!req.file) return res.status(400).send('Upload Completely Failed.');
    res.send('<script>alert("File Received!"); window.location.href="/";</script>');
});

app.listen(PORT, '0.0.0.0', () => {
    console.clear();
    console.log(`==================================================`);
    console.log(`📡 SERVER OVER SYSTEM LAN RUNNING`);
    console.log(`==================================================`);
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const config of interfaces[name]) {
            if (config.family === 'IPv4' && !config.internal) {
                console.log(`📱 Phone URL: http://${config.address}:${PORT}`);
            }
        }
    }
    console.log(`==================================================`);
});