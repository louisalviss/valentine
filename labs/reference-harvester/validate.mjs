import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const base = path.join(root, 'labs', 'reference-harvester');
const registryPath = path.join(base, 'reference-registry.json');

function fail(message) {
  console.error(`REFERENCE_HARVESTER_QA_FAIL: ${message}`);
  process.exitCode = 1;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`${path.relative(root, file)}: ${error.message}`);
    return null;
  }
}

const registry = readJson(registryPath);
if (!registry) process.exit(1);

if (registry.version !== '1.0') fail('registry version must be 1.0');
if (!registry.feed_authority || !['unresolved', 'connected'].includes(registry.feed_authority.status)) {
  fail('feed_authority.status must be unresolved or connected');
}
if (registry.feed_authority.status === 'connected' && !registry.feed_authority.source) {
  fail('connected feed authority requires source');
}
if (!registry.fidelity_policy || Number(registry.fidelity_policy.visual_pass_min) !== 98) {
  fail('visual_pass_min must remain 98');
}
if (registry.fidelity_policy.motion_requires_separate_evidence !== true) {
  fail('motion_requires_separate_evidence must remain true');
}

const requiredViewports = new Set(['390x844', '768x1024', '1440x900']);
const configuredViewports = new Set((registry.fidelity_policy.required_viewports || []).map(v => `${v.width}x${v.height}`));
for (const viewport of requiredViewports) {
  if (!configuredViewports.has(viewport)) fail(`missing required viewport ${viewport}`);
}

if (!Array.isArray(registry.references)) fail('references must be an array');
const ids = new Set();
for (const ref of registry.references || []) {
  if (!ref.id || !/^[a-z0-9][a-z0-9-]*$/.test(ref.id)) fail('reference id must be lowercase kebab-case');
  if (ids.has(ref.id)) fail(`duplicate reference id ${ref.id}`);
  ids.add(ref.id);
  if (!/^https:\/\//.test(ref.source_url || '')) fail(`${ref.id}: source_url must use https`);
  if (!['source-import', 'localized-public-source', 'render-equivalent-rebuild'].includes(ref.reconstruction_mode)) {
    fail(`${ref.id}: invalid reconstruction_mode`);
  }
  if (ref.live && !/^\.\.\/labs\/references\//.test(ref.live)) fail(`${ref.id}: live must resolve under ../labs/references/`);
  if (ref.preview && !/^\.\.\/labs\/references\//.test(ref.preview)) fail(`${ref.id}: preview must resolve under ../labs/references/`);
  const visual = ref.fidelity?.visual;
  const motion = ref.fidelity?.motion_interaction;
  if (visual?.status === 'pass' && Number(visual.score) < 98) fail(`${ref.id}: visual PASS requires score >=98`);
  if (Number(visual?.score) >= 98 && visual?.status === 'pending') fail(`${ref.id}: score >=98 cannot remain pending`);
  if (ref.status === 'verified' && visual?.status !== 'pass') fail(`${ref.id}: verified reference requires visual PASS`);
  if (ref.status === 'verified' && !['pass', 'not-applicable'].includes(motion?.status)) {
    fail(`${ref.id}: verified reference requires separate motion/interaction evidence`);
  }
  if (ref.status === 'verified' && ref.essential_origin_dependency === true) {
    fail(`${ref.id}: verified reference cannot depend on origin for essential rendering`);
  }
  if (!ref.provenance?.rights_status) fail(`${ref.id}: provenance.rights_status required`);
}

const referencesDir = path.join(root, 'labs', 'references');
if (fs.existsSync(referencesDir)) {
  for (const entry of fs.readdirSync(referencesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = path.join(referencesDir, entry.name, 'capture-manifest.json');
    if (!fs.existsSync(manifest)) continue;
    const data = readJson(manifest);
    if (!data) continue;
    if (data.version !== '1.0') fail(`${entry.name}: manifest version must be 1.0`);
    if (data.reference_id !== entry.name) fail(`${entry.name}: reference_id must match folder name`);
    if (!/^https:\/\//.test(data.source?.url || '')) fail(`${entry.name}: manifest source.url must use https`);
    if (!['source-import', 'localized-public-source', 'render-equivalent-rebuild'].includes(data.reconstruction?.mode)) fail(`${entry.name}: invalid manifest reconstruction mode`);
    if (data.reconstruction?.local_path !== `labs/references/${entry.name}/`) fail(`${entry.name}: manifest local_path mismatch`);
    const states = data.capture?.states;
    if (!Array.isArray(states) || states.length < 1) fail(`${entry.name}: at least one captured state required`);
    const viewports = new Set((data.capture?.viewports || []).map(v => `${v.width}x${v.height}`));
    for (const viewport of requiredViewports) if (!viewports.has(viewport)) fail(`${entry.name}: manifest missing ${viewport}`);
    const score = Number(data.fidelity?.visual?.score);
    const visualStatus = data.fidelity?.visual?.status;
    const motionStatus = data.fidelity?.motion_interaction?.status;
    if (visualStatus === 'pass' && score < 98) fail(`${entry.name}: manifest visual PASS requires score >=98`);
    if (visualStatus === 'pass' && !['pass', 'review', 'not-applicable'].includes(motionStatus)) fail(`${entry.name}: static PASS must not silently imply motion PASS; motion evidence status required`);

    if (visualStatus === 'pass') {
      const reportPath = path.join(referencesDir, entry.name, 'evidence', 'fidelity.json');
      if (!fs.existsSync(reportPath)) {
        fail(`${entry.name}: visual PASS requires measured evidence/fidelity.json`);
      } else {
        const report = readJson(reportPath);
        if (report && (report.status !== 'pass' || Number(report.minimum_score) < 98)) {
          fail(`${entry.name}: visual PASS conflicts with measured minimum ${report.minimum_score}`);
        }
      }
    }
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`REFERENCE_HARVESTER_QA_OK references=${registry.references.length} feed=${registry.feed_authority.status}`);
