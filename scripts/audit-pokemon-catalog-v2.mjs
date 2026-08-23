import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/pokemon-catalog-v2.generated.json'), 'utf8'));
const sources = [
  'src/lib/pokemon-catalog-v2.seed.ts',
  'src/lib/pokemon-catalog-v2.gen5.ts',
  'src/lib/pokemon-form-policies-v2.ts',
  'src/lib/pokemon-form-classification-v2.ts',
  'src/lib/pokemon-catalog-v2.additional.ts',
].map((relativePath) => ({
  relativePath,
  content: fs.readFileSync(path.join(root, relativePath), 'utf8'),
}));

const duplicateGeneratedKeys = generated
  .map((entry) => entry.key)
  .filter((key, index, keys) => keys.indexOf(key) !== index);
const invalidGeneratedKeys = generated.filter(
  (entry) => entry.key !== `pokemon:${entry.speciesId}:${entry.formKey}`,
);
const invalidLegacyIdentities = generated.filter(
  (entry) => !entry.legacy?.pokemonIds?.length || !entry.legacy?.formNames?.length,
);
const representedLegacyFormNames = generated.reduce(
  (total, entry) => total + new Set(entry.legacy.formNames).size,
  0,
);
const generatedVerification = generated.reduce((counts, entry) => {
  const status = entry.verification?.status || 'unverified';
  counts[status] = (counts[status] || 0) + 1;
  return counts;
}, {});
const falselyVerifiedGenerated = generated.filter((entry) =>
  entry.verification?.status === 'verified'
  && (!entry.verification.sourceUrls?.some((url) => url.includes('bulbapedia.bulbagarden.net'))
    || !entry.verification.sourceUrls?.some((url) => url.includes('serebii.net'))
    || !entry.verification.lastVerifiedAt),
);

const allSourceText = sources.map((source) => source.content).join('\n');
const forbiddenSources = [...allSourceText.matchAll(/https?:\/\/[^'`\s]+/g)]
  .map((match) => match[0])
  .filter((url) => url.includes('pokemon.com'));
const staticReferenceUrls = [...allSourceText.matchAll(/https?:\/\/[^'`$\s]+/g)]
  .map((match) => match[0]);
const unsupportedReferenceUrls = staticReferenceUrls.filter(
  (url) => !url.includes('bulbapedia.bulbagarden.net') && !url.includes('serebii.net'),
);

const assetPaths = [...allSourceText.matchAll(/(?:normalStatic|shinyStatic|normalAnimated|shinyAnimated|femaleNormal|femaleShiny):\s*'([^']+)'/g)]
  .map((match) => match[1]);
const missingAssets = assetPaths.filter((assetPath) => !fs.existsSync(path.join(root, 'public', assetPath.replace(/^\//, ''))));

const policySource = sources.find((source) => source.relativePath.endsWith('pokemon-form-policies-v2.ts')).content;
const policyIds = [...policySource.matchAll(/\{ speciesId: (\d+), cardMode:/g)].map((match) => Number(match[1]));
const duplicatePolicyIds = policyIds.filter((id, index) => policyIds.indexOf(id) !== index);
const partialPolicyIds = [...policySource.matchAll(/\{ speciesId: (\d+), cardMode:[^\n]+verificationStatus: 'partial'/g)]
  .map((match) => Number(match[1]));
const unverifiedPolicyIds = [...policySource.matchAll(/\{ speciesId: (\d+), cardMode:[^\n]+verificationStatus: 'unverified'/g)]
  .map((match) => Number(match[1]));
const policyIdSet = new Set(policyIds);
const entitiesBySpecies = new Map();
generated.forEach((entry) => {
  const entries = entitiesBySpecies.get(entry.speciesId) || [];
  entries.push(entry);
  entitiesBySpecies.set(entry.speciesId, entries);
});
const explicitlyClassifiedWithoutPolicy = new Set([25]); // Partner Cap Pikachu is an event form.
const regionalName = /-(alola|galar|hisui|paldea)(?:-|$)/;
const missingMultiFormPolicies = [...entitiesBySpecies.entries()]
  .filter(([, entries]) => entries.length > 1)
  .filter(([speciesId, entries]) => {
    if (policyIdSet.has(speciesId) || explicitlyClassifiedWithoutPolicy.has(speciesId)) return false;
    return entries.some((entry) => entry.formKey !== 'base' && !regionalName.test(entry.canonicalName));
  })
  .map(([speciesId, entries]) => ({ speciesId, forms: entries.map((entry) => entry.canonicalName) }));

const unknownClassifications = generated.filter((entry) => {
  if (entry.formKey === 'base' || regionalName.test(entry.canonicalName)) return false;
  if (policyIdSet.has(entry.speciesId) || explicitlyClassifiedWithoutPolicy.has(entry.speciesId)) return false;
  return true;
});

const additionalSource = sources.find((source) => source.relativePath.endsWith('pokemon-catalog-v2.gen5.ts')).content;
const additionalKeys = [...additionalSource.matchAll(/additionalEntity\(\{ speciesId: (\d+), formKey: '([^']+)'/g)]
  .map((match) => `pokemon:${match[1]}:${match[2]}`);
additionalKeys.push(
  ...[...sources.find((source) => source.relativePath.endsWith('pokemon-catalog-v2.additional.ts')).content
    .matchAll(/castformWeatherForm\('([^']+)'/g)]
    .map((match) => `pokemon:351:${match[1]}`),
);
additionalKeys.push('pokemon:666:poke-ball-pattern');
const generatedKeySet = new Set(generated.map((entry) => entry.key));
const collidingAdditionalKeys = additionalKeys.filter((key) => generatedKeySet.has(key));

const summary = {
  generatedIdentities: generated.length,
  additionalOfficialForms: additionalKeys.length,
  effectiveV2Entities: generated.length + additionalKeys.length,
  duplicateGeneratedKeys: new Set(duplicateGeneratedKeys).size,
  invalidGeneratedKeys: invalidGeneratedKeys.length,
  invalidLegacyIdentities: invalidLegacyIdentities.length,
  representedLegacyFormNames,
  verifiedGeneratedIdentities: generatedVerification.verified || 0,
  partialGeneratedIdentities: generatedVerification.partial || 0,
  unverifiedGeneratedIdentities: generatedVerification.unverified || 0,
  falselyVerifiedGeneratedIdentities: falselyVerifiedGenerated.length,
  duplicatePolicyIds: new Set(duplicatePolicyIds).size,
  partialPolicyIds: partialPolicyIds.length,
  unverifiedPolicyIds: unverifiedPolicyIds.length,
  missingMultiFormPolicies: missingMultiFormPolicies.length,
  unknownClassifications: unknownClassifications.length,
  collidingAdditionalKeys: collidingAdditionalKeys.length,
  missingAssignedAssets: missingAssets.length,
  forbiddenSources: forbiddenSources.length,
  unsupportedStaticReferenceUrls: unsupportedReferenceUrls.length,
};

const report = {
  summary,
  duplicateGeneratedKeys: [...new Set(duplicateGeneratedKeys)],
  invalidGeneratedKeys,
  invalidLegacyIdentities,
  generatedVerification,
  falselyVerifiedGenerated,
  duplicatePolicyIds: [...new Set(duplicatePolicyIds)],
  partialPolicyIds,
  unverifiedPolicyIds,
  missingMultiFormPolicies,
  unknownClassifications,
  collidingAdditionalKeys,
  missingAssets,
  forbiddenSources,
  unsupportedReferenceUrls,
};

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log('Pokemon catalog v2 audit');
  Object.entries(summary).forEach(([key, value]) => console.log(`${key}: ${value}`));
}

if (
  summary.duplicateGeneratedKeys
  || summary.invalidGeneratedKeys
  || summary.invalidLegacyIdentities
  || summary.falselyVerifiedGeneratedIdentities
  || summary.duplicatePolicyIds
  || summary.missingMultiFormPolicies
  || summary.unknownClassifications
  || summary.collidingAdditionalKeys
  || summary.missingAssignedAssets
  || summary.forbiddenSources
  || summary.unsupportedStaticReferenceUrls
) process.exitCode = 1;

// A structural audit may pass while editorial source verification is ongoing.
// A release audit is stricter: not one generated identity may remain unverified.
if (process.argv.includes('--release') && summary.unverifiedGeneratedIdentities > 0) {
  console.error(`Release blocked: ${summary.unverifiedGeneratedIdentities} generated identities still require source verification.`);
  process.exitCode = 1;
}
if (process.argv.includes('--release') && (summary.partialPolicyIds > 0 || summary.unverifiedPolicyIds > 0)) {
  console.error(`Release blocked: ${summary.partialPolicyIds} partial and ${summary.unverifiedPolicyIds} unverified species policies remain.`);
  process.exitCode = 1;
}
