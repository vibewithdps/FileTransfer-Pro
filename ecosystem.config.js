module.exports = {
  apps: [
    {
      name: "filetransfer-pro",
      script: "server/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        AUTO_OPEN: "false"
      }
    }
  ]
};
