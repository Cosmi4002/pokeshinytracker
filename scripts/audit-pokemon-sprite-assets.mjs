import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const mapPath = path.join(root, 'src/lib/local-sprite-map.generated.ts');
const spriteLogicPath = path.join(root, 'src/lib/pokemon-data.ts');
const catalogAssetPaths = [
  'src/lib/pokemon-catalog-v2.seed.ts',
  'src/lib/pokemon-catalog-v2.gen5.ts',
  'src/lib/pokemon-catalog-v2.additional.ts',
].flatMap((relativePath) => {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  return [...source.matchAll(/'([^']*\/img\/pokemon-sprites\/[^']+)'/g)]
    .map((match) => match[1])
    .filter((value) => value.startsWith('/img/pokemon-sprites/'));
});

const mapSource = fs.readFileSync(mapPath, 'utf8');
const spriteLogic = fs.readFileSync(spriteLogicPath, 'utf8');

const mappings = [...mapSource.matchAll(/^\s*"([^"]+)":\s*"([^"]+)",?$/gm)].map((match) => ({
  remoteUrl: match[1],
  localUrl: match[2],
}));

const missingMappedFiles = mappings.filter(({ localUrl }) => {
  const relativePath = localUrl.replace(/^\//, '');
  return !fs.existsSync(path.join(publicRoot, relativePath.replace(/^img\//, 'img/')));
});

const localTargets = new Map();
mappings.forEach((mapping) => {
  const group = localTargets.get(mapping.localUrl) || [];
  group.push(mapping.remoteUrl);
  localTargets.set(mapping.localUrl, group);
});
const sharedLocalTargets = [...localTargets.entries()]
  .filter(([, remoteUrls]) => remoteUrls.length > 1)
  .map(([localUrl, remoteUrls]) => ({ localUrl, remoteUrls }));

const literalRemoteUrls = new Set(
  [...spriteLogic.matchAll(/['`](https?:\/\/[^'`$]+)['`]/g)].map((match) => match[1]),
);
const mappedRemoteUrls = new Set(mappings.map((mapping) => mapping.remoteUrl));
const uncachedLiteralUrls = [...literalRemoteUrls]
  .filter((url) => !mappedRemoteUrls.has(url))
  // Dynamic sprite URLs append an ID/path to this base at runtime.
  .filter((url) => !mappings.some((mapping) => mapping.remoteUrl.startsWith(`${url}/`)))
  .sort();

const files = [];
const spriteRoot = path.join(publicRoot, 'img/pokemon-sprites');
function walk(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else files.push(`/${path.relative(publicRoot, fullPath).split(path.sep).join('/')}`);
  });
}
walk(spriteRoot);

const mappedTargets = new Set([...mappings.map((mapping) => mapping.localUrl), ...catalogAssetPaths]);
const orphanFiles = files.filter(
  (file) => file !== '/img/pokemon-sprites/failed-downloads.json' && !mappedTargets.has(file),
);

const report = {
  summary: {
    cachedFiles: files.length,
    urlMappings: mappings.length,
    missingMappedFiles: missingMappedFiles.length,
    sharedLocalTargets: sharedLocalTargets.length,
    literalRemoteUrlsInSpriteLogic: literalRemoteUrls.size,
    uncachedLiteralUrls: uncachedLiteralUrls.length,
    orphanFiles: orphanFiles.length,
  },
  missingMappedFiles,
  sharedLocalTargets,
  uncachedLiteralUrls,
  orphanFiles,
};

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log('Pokemon sprite asset audit');
  Object.entries(report.summary).forEach(([key, value]) => console.log(`${key}: ${value}`));
  if (uncachedLiteralUrls.length) {
    console.log('\nRemote URLs used by sprite logic but absent from the local cache map:');
    uncachedLiteralUrls.forEach((url) => console.log(`- ${url}`));
  }
}

if (missingMappedFiles.length) process.exitCode = 1;
