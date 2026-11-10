import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Store, dataDirectory } from '../lib/store.ts';

const keyFile = resolve(dataDirectory(), 'account-keys.local.txt');
if (existsSync(keyFile)) throw new Error('Local account keys already exist. Setup does not overwrite them.');
const store = new Store();
try {
  store.seedAccounts(accounts => {
    writeFileSync(keyFile, ['LOCAL FICTIONAL DEMO ONLY. Do not share or commit this file.',
      ...accounts.map(({ actor, key }) => `${actor.name}\nAccount: ${actor.id}\nDemo key: ${key}\n`)].join('\n\n'), { flag: 'wx', mode: 0o600 });
  });
  console.log('Created five fictional demo accounts. Keys are in account-keys.local.txt inside the data directory (default .demo/, Git-ignored). No reports were seeded.');
} finally { store.close(); }
