/*
==========================================================
    FileTransfer Pro v2
    LAN IP & Network Interface Detection Utility
==========================================================
*/

"use strict";

const os = require("os");

/**
 * Retrieves all active non-internal IPv4 LAN addresses
 * Works across macOS, Windows, and Linux
 * @returns {Array<{name: string, address: string, internal: boolean}>}
 */
function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const results = [];

    for (const [name, netConfigs] of Object.entries(interfaces)) {
        if (!netConfigs) continue;

        for (const config of netConfigs) {
            // Only consider IPv4 and non-loopback addresses
            if (config.family === "IPv4" && !config.internal) {
                // Determine interface type priority (Wi-Fi / Ethernet / etc.)
                let type = "lan";
                const lower = name.toLowerCase();
                if (lower.includes("wi-fi") || lower.includes("wifi") || lower.includes("wlan") || lower.includes("en0")) {
                    type = "wifi";
                } else if (lower.includes("eth") || lower.includes("en1") || lower.includes("ethernet")) {
                    type = "ethernet";
                }

                results.push({
                    name,
                    address: config.address,
                    netmask: config.netmask,
                    type
                });
            }
        }
    }

    // Sort to prioritize Wi-Fi and Ethernet over virtual adapters (e.g. docker, vEthernet)
    results.sort((a, b) => {
        const priority = { wifi: 1, ethernet: 2, lan: 3 };
        return (priority[a.type] || 4) - (priority[b.type] || 4);
    });

    return results;
}

/**
 * Gets the primary LAN IPv4 address (e.g., 192.168.x.x or 10.x.x.x)
 * Falls back to 127.0.0.1 if no network is connected
 * @returns {string}
 */
function getPrimaryIp() {
    const interfaces = getNetworkInterfaces();
    if (interfaces.length > 0) {
        return interfaces[0].address;
    }
    return "127.0.0.1";
}

module.exports = {
    getNetworkInterfaces,
    getPrimaryIp
};
