// The account specs call server modules directly (purgeOldLogs), outside
// Next's server build, where `import 'server-only'` throws by design. Import
// this before any of them to stand in the package's server build, which is
// empty.
const path = require.resolve('server-only');
require.cache[path] = { id: path, filename: path, loaded: true, exports: {} } as NodeJS.Module;
