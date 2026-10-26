import { test } from "node:test";
import assert from "node:assert/strict";
import { availablePage } from "../src/records.mjs";

test("shrinking approval queues recover to an existing page", () => {
  let page = availablePage(2, Math.ceil(31 / 30));
  assert.equal(page, 2);
  page = availablePage(page, Math.ceil(30 / 30));
  assert.equal(page, 1);
  assert.equal(availablePage(page, 0), 1);
  assert.equal(availablePage(3, 5), 3);
});
