// Pin the "device" timezone so timezone-sensitive tests are deterministic
// regardless of where the suite runs (CI, contributor laptops, etc.).
// Node honours runtime changes to process.env.TZ for subsequent Date operations.
process.env.TZ = 'Europe/London';
