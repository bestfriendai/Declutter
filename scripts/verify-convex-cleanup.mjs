import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const forbiddenFiles = [
  '.firebaserc',
  'FIREBASE_BACKEND.md',
  'config/firebase.ts',
  'firebase-debug.log',
  'services/auth.ts',
  'services/firestore.ts',
  'services/storage.ts',
  'hooks/useCloudSync.ts',
  'firebase.json',
  'firestore.indexes.json',
  'firestore.rules',
  'storage.rules',
];

const forbiddenDirectories = ['firebase'];

const runtimeRoots = ['app', 'context', 'components', 'hooks', 'services', 'config'];
const runtimeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const forbiddenImportPatterns = [
  /from ['"]firebase(?:\/[^'"]*)?['"]/,
  /from ['"]@\/config\/firebase['"]/,
  /from ['"]@\/services\/auth['"]/,
  /from ['"]@\/services\/firestore['"]/,
  /from ['"]@\/services\/storage['"]/,
];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const relativePath of forbiddenFiles) {
  assert(!fs.existsSync(path.join(root, relativePath)), `Forbidden file still exists: ${relativePath}`);
}

for (const relativePath of forbiddenDirectories) {
  assert(!fs.existsSync(path.join(root, relativePath)), `Forbidden directory still exists: ${relativePath}/`);
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8')
);
assert(
  !packageJson.dependencies?.firebase && !packageJson.devDependencies?.firebase,
  'package.json still includes the firebase package'
);

const envExamplePath = path.join(root, '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  assert(
    !/FIREBASE/i.test(envExample),
    '.env.example still contains Firebase environment variables or comments'
  );
}

function walk(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const entryRelative = path.join(relativeDir, entry.name);
    const entryAbsolute = path.join(root, entryRelative);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(entryRelative);
      continue;
    }

    if (!runtimeExtensions.has(path.extname(entry.name))) continue;

    const contents = fs.readFileSync(entryAbsolute, 'utf8');
    for (const pattern of forbiddenImportPatterns) {
      if (pattern.test(contents)) {
        failures.push(`${entryRelative} contains a forbidden Firebase import: ${pattern}`);
      }
    }

    if (contents.includes('isFirebaseReady')) {
      failures.push(`${entryRelative} still uses the legacy isFirebaseReady naming`);
    }
  }
}

for (const runtimeRoot of runtimeRoots) {
  walk(runtimeRoot);
}

if (fs.existsSync(path.join(root, 'app/auth/forgot-password.tsx'))) {
  failures.push('Unsupported forgot-password route still exists: app/auth/forgot-password.tsx');
}

if (fs.existsSync(path.join(root, 'app/social.tsx'))) {
  const socialScreen = fs.readFileSync(path.join(root, 'app/social.tsx'), 'utf8');
  assert(
    !socialScreen.includes('getActiveSessions(') &&
      !socialScreen.includes('getSharedWithMe(') &&
      !socialScreen.includes('joinBodyDoublingSession('),
    'app/social.tsx still depends on unsupported body-doubling/shared-room flows'
  );
}

if (fs.existsSync(path.join(root, 'app/join.tsx'))) {
  const joinScreen = fs.readFileSync(path.join(root, 'app/join.tsx'), 'utf8');
  assert(
    !joinScreen.includes('joinBodyDoublingSession(') &&
      !joinScreen.includes('joinSharedRoom('),
    'app/join.tsx still depends on unsupported session/shared-room flows'
  );
}

if (failures.length > 0) {
  console.error('Convex cleanup verification failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Convex cleanup verification passed.');
