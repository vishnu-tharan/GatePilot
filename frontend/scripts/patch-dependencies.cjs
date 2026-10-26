// Temporary, version-checked mitigations for advisories with no upstream release.
// Remove each patch when its dependency publishes and we adopt the actual fix.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..", "node_modules");
const pending = [];
function patch(packageName, version, file, replacements) {
  const dir = path.join(root, packageName);
  const installed = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).version;
  if (installed !== version)
    throw new Error(`Review security patch for ${packageName}@${installed}; expected ${version}`);
  const target = path.join(dir, file);
  const original = fs.readFileSync(target, "utf8");
  let source = original;
  for (const [before, after] of replacements) {
    if (source.includes(after)) continue;
    if (source.split(before).length !== 2)
      throw new Error(`Security patch source mismatch: ${packageName}/${file}`);
    source = source.replace(before, after);
  }
  if (source !== original) pending.push([target, source]);
}
// GHSA-vfj7-8cjw-p6xm: bound parser nesting and all public recursive AST walkers.
const depthGuard =
  "\n    if (depth > 128) throw new SyntaxError('Brace pattern nesting exceeds safety limit (128)');";
patch("braces", "3.0.3", "lib/parse.js", [
  [
    "block = push({ type: 'paren', nodes: [] });\n      stack.push(block);",
    "block = push({ type: 'paren', nodes: [] });\n      if (stack.length >= 128) throw new SyntaxError('Brace pattern nesting exceeds safety limit (128)');\n      stack.push(block);",
  ],
  [
    "block = push(brace);\n      stack.push(block);",
    "block = push(brace);\n      if (stack.length >= 128) throw new SyntaxError('Brace pattern nesting exceeds safety limit (128)');\n      stack.push(block);",
  ],
]);
for (const file of ["compile", "expand"]) {
  patch("braces", "3.0.3", `lib/${file}.js`, [
    [
      "const walk = (node, parent = {}) => {",
      `const walk = (node, parent = {}, depth = 0) => {${depthGuard}`,
    ],
    ["walk(child, node)", "walk(child, node, depth + 1)"],
  ]);
}
patch("braces", "3.0.3", "lib/stringify.js", [
  [
    "const stringify = (node, parent = {}) => {",
    `const stringify = (node, parent = {}, depth = 0) => {${depthGuard}`,
  ],
  ["stringify(child)", "stringify(child, {}, depth + 1)"],
]);
// GHSA-86w9-cpqp-85rv: enforce the nested AlgorithmIdentifier element count.
patch("node-forge", "1.4.0", "lib/rsa.js", [
  [
    "obj.value.length !== 2) {",
    "obj.value.length !== 2 ||\n            obj.value[0].value.length !== ('parameters' in capture ? 2 : 1)) {",
  ],
]);
for (const [target, source] of pending) fs.writeFileSync(target, source);
console.log("Dependency security patches verified (braces, node-forge).");
