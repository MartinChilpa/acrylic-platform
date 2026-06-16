const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const app = express();

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'host',
    'origin',
    'referer'
]);

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade'
]);

function resolvePlatformOrigin(hostname) {
    if (process.env.PLATFORM_API_ORIGIN) {
        return process.env.PLATFORM_API_ORIGIN;
    }
    return hostname.startsWith('dev.') ? 'https://dev.platform.acrylic.la' : 'https://platform.acrylic.la';
}

function buildProxyRequestHeaders(headers, targetHost) {
    const proxyHeaders = {};
    Object.entries(headers).forEach(([key, value]) => {
        if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase()) && value !== undefined) {
            proxyHeaders[key] = value;
        }
    });
    proxyHeaders.host = targetHost;
    return proxyHeaders;
}

app.use('/api', (req, res) => {
    const platformOrigin = resolvePlatformOrigin(req.hostname || '');
    const targetUrl = new URL(req.originalUrl, platformOrigin);
    const client = targetUrl.protocol === 'https:' ? https : http;

    const proxyReq = client.request(targetUrl, {
        method: req.method,
        headers: buildProxyRequestHeaders(req.headers, targetUrl.host),
    }, (proxyRes) => {
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
            if (!HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase()) && value !== undefined) {
                res.setHeader(key, value);
            }
        });
        res.status(proxyRes.statusCode || 502);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
        if (!res.headersSent) {
            res.status(502).json({ detail: 'Platform API proxy request failed' });
        }
    });

    req.pipe(proxyReq);
});

// Serve static files from the 'dist/acrylic-app' directory
app.use(express.static(path.join(__dirname, 'dist', 'acrylic-app', 'browser')));

// For any other route, serve the 'index.html' file
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'dist', 'acrylic-app', 'browser', 'index.html'));
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
