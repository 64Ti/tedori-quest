// tests/harness.js
// ★実行環境の差異を吸収する唯一の層。
//   テストファイルは runner.js / node:test を直接 import しないこと。
const isNode = typeof process !== 'undefined' && process.versions?.node;

let _describe, _test, _assert;

if (isNode){
  const nt = await import('node:test');
  const na = await import('node:assert/strict');
  _describe = nt.describe;
  _test     = nt.test;
  _assert   = na.default;
}else{
  const r = await import('./runner.js');
  _describe = r.describe;
  _test     = r.test;
  _assert   = r.assert;
}

export const describe = _describe;
export const test     = _test;
export const assert   = _assert;
