/**
 * Dev-server proxy for `ng serve`.
 *
 * Mirrors what server.js does in the deployed app: it forwards /api to the
 * platform backend and drops `WWW-Authenticate`. The platform answers 401 on
 * protected endpoints with `WWW-Authenticate: Basic realm="api"`, and since the
 * API is served under the app's own origin the browser would treat that as its
 * own auth challenge and pop up the native credentials dialog. Auth is handled
 * by our own sign-in screen, so the challenge must never reach the browser.
 */
const target = process.env.PLATFORM_API_ORIGIN || 'http://127.0.0.1:8000';

module.exports = {
    '/api': {
        target,
        secure: false,
        changeOrigin: true,
        onProxyRes: (proxyRes) => {
            delete proxyRes.headers['www-authenticate'];
        },
    },
};
