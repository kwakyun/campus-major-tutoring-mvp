// Read-only validation. Pass an installed yaml package path as argv[2] if needed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
let YAML;
if (process.argv[2]) YAML = require(path.resolve(process.argv[2]));
else {
  try { YAML = require('yaml'); }
  catch {
    assert(process.env.TEMP, 'Install yaml or pass its package directory');
    YAML = require(path.join(process.env.TEMP, 'codex-major-hour-yaml-validation/node_modules/yaml'));
  }
}
const dir = __dirname;
const root = path.dirname(dir);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml')).sort();
const parsed = new Map();
for (const f of files) {
  const doc = YAML.parseDocument(fs.readFileSync(path.join(dir, f), 'utf8'), {uniqueKeys:true});
  assert.equal(doc.errors.length, 0, `${f}: ${doc.errors.join('; ')}`);
  assert.equal(doc.warnings.length, 0, `${f}: ${doc.warnings.join('; ')}`);
  parsed.set(f, doc.toJS());
}
const workflow = parsed.get('00-workflow.yaml');
assert.equal(workflow.kind, 'agent_prompt_workflow');
assert.equal(workflow.artifact_state, 'PLANNED');
assert.equal(files.length, 11);
assert.equal(Object.keys(workflow.roles).length, 8);
assert.equal(workflow.execution_order.length, 10);
assert.equal(workflow.stage_registry.length, 10);
assert.equal(new Set(workflow.source_documents).size, workflow.source_documents.length);
for (const f of workflow.source_documents) assert(fs.existsSync(path.join(root, f)), `Missing source: ${f}`);
const alignment = fs.readFileSync(path.join(root, workflow.source_handling.alignment_file), 'utf8');
const refs = new Set([...alignment.matchAll(/\| (SRC-\d{2}) \|/g)].map(m => m[1]));
assert.equal(refs.size, 12);
const seen = new Set();
const handoffs = new Set();
const covered = new Set();
const all = [];
const stages = [];
for (const [i, file] of workflow.execution_order.entries()) {
  const s = parsed.get(path.basename(file));
  assert(s, `Missing stage: ${file}`);
  stages.push(s);
  assert.equal(s.kind, 'agent_prompt_stage');
  assert.equal(s.order, i + 1);
  assert.equal(s.id, 'S' + String(i + 1).padStart(2, '0'));
  assert.equal(s.status, 'PLANNED');
  assert.equal(s.content_revision, workflow.content_revision);
  assert.equal(s.common_file, 'agent-prompts/00-workflow.yaml');
  assert.equal(s.source_alignment_file, workflow.source_handling.alignment_file);
  const reg = workflow.stage_registry[i];
  assert.equal(reg.id, s.id);
  assert.equal(reg.file, file);
  assert.equal(reg.name, s.title);
  assert.deepEqual(reg.requires_stage_gates, s.requires_stage_gates);
  for (const dep of s.requires_stage_gates) assert(seen.has(dep), `${s.id} missing prior gate ${dep}`);
  assert.deepEqual(s.commands[0].depends_on, s.requires_stage_gates);
  for (const [j, t] of s.commands.entries()) {
    assert(!seen.has(t.id), `Duplicate ID ${t.id}`);
    assert.equal(t.order, j + 1);
    assert.equal(t.status, 'PLANNED');
    assert(workflow.roles[t.agent], `Unknown role ${t.agent}`);
    assert(t.prompt.trim() && t.condition.trim() && t.expected_outputs.length && t.acceptance_criteria.length);
    assert(!/添付資料反映/.test(t.prompt));
    for (const dep of t.depends_on) assert(seen.has(dep), `${t.id}: missing, future or cyclic dependency ${dep}`);
    assert(!handoffs.has(t.handoff_file), `Duplicate handoff ${t.handoff_file}`);
    assert(t.allowed_paths.includes(t.handoff_file), `${t.id} cannot write handoff`);
    for (const out of t.expected_outputs) {
      assert(!out.startsWith('/') && !out.split(/[\\/]/).includes('..'), `${t.id}: unsafe output ${out}`);
      assert(t.allowed_paths.some(p => {
        const clean = p.replace(/ \(.*\)$/, '');
        return clean.endsWith('/**') ? out.startsWith(clean.slice(0,-2)) : out === clean;
      }), `${t.id}: expected output outside allowed paths: ${out}`);
    }
    for (const ref of t.source_requirements || []) { assert(refs.has(ref), `${t.id}: unknown requirement ${ref}`); covered.add(ref); }
    seen.add(t.id); handoffs.add(t.handoff_file); all.push(t);
  }
  const gate = s.commands.at(-1);
  assert.equal(gate.id, reg.gate);
  assert.deepEqual(gate.depends_on, s.commands.slice(0,-1).map(t => t.id));
  for (const criterion of s.exit_criteria) assert(gate.acceptance_criteria.includes(criterion));
}
assert.equal(all.length, 65);
assert.deepEqual([...covered].sort(), [...refs].sort());
const s09 = stages.find(s => s.id === 'S09');
assert.deepEqual(s09.requires_stage_gates, ['S06-GATE']);
const s10 = stages.find(s => s.id === 'S10');
const tracks = s10.selection.allowed_values;
assert.deepEqual(tracks, ['personalization','group','multi_session','performance','campus_area_expansion','referral_rewards']);
function applies(condition, track) {
  if (condition === 'always') return true;
  let m = condition.match(/^selected_track == ([a-z_]+)$/);
  if (m) { assert(tracks.includes(m[1])); return m[1] === track; }
  m = condition.match(/^selected_track in \[([a-z_, ]+)\]$/);
  assert(m, `Invalid condition: ${condition}`);
  const options = m[1].split(',').map(x=>x.trim());
  for (const item of options) assert(tracks.includes(item), `Unknown track: ${item}`);
  return options.includes(track);
}
const conditional = s10.commands.filter(t=>t.condition !== 'always');
const trackMatrix = Object.fromEntries(tracks.map(track=>[track, conditional.filter(t=>applies(t.condition,track)).map(t=>t.id)]));
assert.deepEqual(trackMatrix.campus_area_expansion, ['S10-T03','S10-T04','S10-T06']);
assert.deepEqual(trackMatrix.referral_rewards, ['S10-T04','S10-T05','S10-T06']);
for (const ids of Object.values(trackMatrix)) assert(ids.length > 0);
const hashes = Object.fromEntries([...workflow.source_documents, ...files.map(f=>'agent-prompts/'+f), 'agent-prompts/README.md', 'agent-prompts/validate-prompts.cjs'].map(f => [f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
console.log(JSON.stringify({
  status:'PASS', validated_at:new Date().toISOString(), content_revision:workflow.content_revision,
  parser:'yaml', yaml_files:files.length, stages:stages.length, roles:Object.keys(workflow.roles).length,
  commands:all.length, implementation_commands:all.filter(t=>!t.id.endsWith('-GATE')).length,
  stage_gates:stages.length, source_requirements:refs.size,
  commands_with_source_requirements:all.filter(t=>t.source_requirements?.length).length,
  duplicate_ids:0, missing_dependencies:0, dependency_cycles:0,
  checked:['YAML syntax and duplicate keys','stage order and registry','role IDs','command order and acyclic dependencies','stage gate completeness','handoff uniqueness and expected output write scopes','source documents and SRC traceability','conditional dispatch for all six expansion tracks','S09 independence from payments/pilot','content hashes'],
  selected_track_matrix:trackMatrix, sha256:hashes,
  scope:'Prompt package validation only; development commands and external operations were not executed.'
},null,2));
