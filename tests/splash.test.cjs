const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../scripts/xystsplash.js'), 'utf8');
const plugin = fs.readFileSync(path.join(__dirname, '../XiaoYuanSearchAdBlock.plugin'), 'utf8');
const regex = new RegExp(plugin.split('\n').find(l => l.startsWith('http-request ')).split(' ')[1], 'i');
const endpoint = 'https://xyst.yuanfudao.com/solar-sync/iphone/sync?_productId=201&av=5';
const headers = { 'content-type': 'application/json;charset=UTF-8', 'content-length': '60', 'user-agent': 'Solar' };
function run(body, url = endpoint, method = 'POST') {
  const calls = [];
  vm.runInNewContext(source, { $request: { url, method, headers, body },
    $done: value => calls.push(JSON.parse(JSON.stringify(value))) }, { timeout: 1000 });
  assert.equal(calls.length, 1);
  return calls[0];
}
const observed = '{"keys":["homepageActivity"],"productId":201,"cursorTime":0}';
test('observed homepageActivity sync gets an empty local response', () => {
  assert.deepEqual(run(observed), { response: { status: 200, headers: { 'Content-Type': 'application/octet-stream' }, body: '' } });
});
test('mixed sync keeps other keys and drops stale length', () => {
  const result = run('{"keys":["gradeConfig","homepageActivity","other"],"productId":201,"cursorTime":5}');
  assert.deepEqual(JSON.parse(result.body), { keys: ['gradeConfig', 'other'], productId: 201, cursorTime: 5 });
  assert.equal(result.headers['content-length'], undefined);
  assert.equal(result.headers['user-agent'], 'Solar');
});
test('other keys, malformed bodies and other methods pass through', () => {
  for (const body of ['{"keys":["gradeConfig"]}', '{"keys":"homepageActivity"}', '["homepageActivity"]', 'bad', '', 'null']) assert.deepEqual(run(body), {});
  assert.deepEqual(run(observed, endpoint, 'GET'), {});
});
test('URL rule bounded to the sync endpoint', () => {
  for (const url of [endpoint, 'https://xyst.yuanfudao.com/solar-sync/iphone/sync']) assert.ok(regex.test(url));
  for (const url of ['https://xyst.yuanfudao.com/solar-sync/iphone/sync/extra', 'https://xyst.yuanfudao.com/solar-sync/iphone/syncx',
    'https://xyks.yuanfudao.com/solar-sync/iphone/sync', 'https://xyst.yuanfudao.com/solar-shepherd/iphone/sync/du']) {
    assert.equal(regex.test(url), false); assert.deepEqual(run(observed, url), {});
  }
});
