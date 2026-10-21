const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const rewrite = config.server.rewriteRequestUrl;

// Metro treats `/assets/<rest>` as `<rest>` under the project root, so
// `/assets/images/favicon.png` looks in `/images` and logs a 404. Files in
// this repo live under `assets/`. Rewrite those requests onto the dev URL
// that already serves them.
config.server.rewriteRequestUrl = (url) => {
  const next = rewrite ? rewrite(url) : url;
  try {
    const absolute = next.startsWith('http') ? new URL(next) : new URL(next, 'http://localhost');
    if (absolute.searchParams.has('unstable_path') || absolute.searchParams.has('export_path')) return next;
    const match = absolute.pathname.match(/^\/assets\/(.+)$/);
    if (!match) return next;
    const rest = decodeURIComponent(match[1]);
    if (rest.includes('..') || path.isAbsolute(rest)) return next;
    const candidate = path.join(projectRoot, 'assets', rest);
    if (!fs.existsSync(candidate)) return next;
    const relative = `./assets/${rest.split(path.sep).join('/')}`;
    absolute.pathname = '/assets/';
    absolute.searchParams.set('unstable_path', relative);
    const rewritten = `${absolute.pathname}?${absolute.searchParams.toString()}`;
    return next.startsWith('http') ? `${absolute.origin}${rewritten}` : rewritten;
  } catch {
    return next;
  }
};

module.exports = config;
