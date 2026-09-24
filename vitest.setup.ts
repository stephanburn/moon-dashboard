// Pin the "device" timezone so timezone-sensitive tests are deterministic
// regardless of where the suite runs. `npm run test:tz` re-runs the suite with
// TEST_TZ set to several zones, to prove nothing depends on the device zone.
// Node honours runtime changes to process.env.TZ for subsequent Date operations.
process.env.TZ = process.env.TEST_TZ ?? 'Europe/London';
