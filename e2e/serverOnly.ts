import Module from 'node:module';

// The account specs call server modules directly (purgeOldLogs), outside
// Next's server build, where `import 'server-only'` throws by design. Import
// this before any of them to stand in the package's server build, which is
// empty. It has to be a real Module: Playwright walks the `children` of every
// dependency outside node_modules, and with node_modules symlinked elsewhere
// the package's resolved path doesn't look like it's in node_modules.
const path = require.resolve('server-only');
const stub = new Module(path);
stub.filename = path;
stub.loaded = true;
require.cache[path] = stub;
