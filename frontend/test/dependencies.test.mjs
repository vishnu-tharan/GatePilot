import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const require = createRequire(import.meta.url);
const braces = require("braces");
const forge = require("node-forge");

test("brace nesting is bounded without breaking ordinary globs", () => {
  assert.deepEqual(braces.expand("src/{api,ui}/*.{js,jsx}"), [
    "src/api/*.js",
    "src/api/*.jsx",
    "src/ui/*.js",
    "src/ui/*.jsx",
  ]);
  assert.equal(braces.compile("{a,b}"), "(a|b)");
  for (const [open, close] of [
    ["{", "}"],
    ["(", ")"],
  ]) {
    for (const input of [open.repeat(4000) + "a" + close.repeat(4000), open.repeat(4000) + "a"]) {
      for (const operation of ["parse", "compile", "expand", "stringify"]) {
        assert.throws(() => braces[operation](input), {
          name: "SyntaxError",
          message: /nesting exceeds safety limit/,
        });
      }
    }
  }
  let ast = { type: "text", value: "x" };
  for (let i = 0; i < 200; i++) {
    const parent = { type: "root", nodes: [ast] };
    ast.parent = parent;
    ast = parent;
  }
  for (const operation of ["compile", "expand", "stringify"]) {
    assert.throws(() => braces[operation](ast), {
      name: "SyntaxError",
      message: /nesting exceeds safety limit/,
    });
  }
});

test("RSA verification rejects extra nested algorithm elements", () => {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 3 });
  const md = forge.md.sha256.create().update("GatePilot signature regression");
  const digest = md.digest().getBytes();
  assert.equal(keys.publicKey.verify(digest, keys.privateKey.sign(md)), true);
  const a = forge.asn1;
  const node = (type, value, constructed = false) =>
    a.create(a.Class.UNIVERSAL, type, constructed, value);
  const oid = () => node(a.Type.OID, a.oidToDer(forge.pki.oids.sha256).getBytes());
  const nullParameter = () => node(a.Type.NULL, "");
  const signature = (algorithm) =>
    keys.privateKey.sign(
      a
        .toDer(
          node(
            a.Type.SEQUENCE,
            [node(a.Type.SEQUENCE, algorithm, true), node(a.Type.OCTETSTRING, digest)],
            true,
          ),
        )
        .getBytes(),
      "NONE",
    );
  assert.equal(keys.publicKey.verify(digest, signature([oid()])), true);
  assert.equal(keys.publicKey.verify(digest, signature([oid(), nullParameter()])), true);
  for (const algorithm of [
    [oid(), nullParameter(), node(a.Type.OCTETSTRING, "extra")],
    [oid(), node(a.Type.OCTETSTRING, "extra")],
    [oid(), nullParameter(), nullParameter()],
  ]) {
    assert.throws(
      () => keys.publicKey.verify(digest, signature(algorithm)),
      /valid RSASSA-PKCS1-v1_5 DigestInfo/,
    );
  }
});

test("NYC YAML loading uses maintained js-yaml without sprintf-js", async () => {
  const loaderPath = require.resolve("@istanbuljs/load-nyc-config");
  const loaderRequire = createRequire(loaderPath);
  assert.equal(loaderRequire("js-yaml/package.json").version.split(".")[0], "4");
  const yamlRequire = createRequire(loaderRequire.resolve("js-yaml"));
  assert.equal(yamlRequire("argparse/package.json").version.split(".")[0], "2");
  const dir = await mkdtemp(path.join(tmpdir(), "gatepilot-config-test-"));
  try {
    await writeFile(path.join(dir, ".nycrc.yml"), "all: true\ninclude:\n  - src/**/*.js\n");
    const config = await loaderRequire(loaderPath).loadNycConfig({
      cwd: dir,
      nycrcPath: ".nycrc.yml",
    });
    assert.equal(config.all, true);
    assert.deepEqual(config.include, ["src/**/*.js"]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
