const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../scripts/xystads.js'), 'utf8');
const plugin = fs.readFileSync(path.join(__dirname, '../XiaoYuanSearchAdBlock.plugin'), 'utf8');
const regex = new RegExp(plugin.split('\n').find(l => l.startsWith('http-response ')).split(' ')[1], 'i');
const endpoint = 'https://xyst.yuanfudao.com/solar-activity/iphone/activity-open/2';
function run(body, url = endpoint, status = 200, method = 'GET') {
  const calls = [];
  vm.runInNewContext(source, { $request: { url, method }, $response: { body, status },
    $done: value => calls.push(JSON.parse(JSON.stringify(value))) }, { timeout: 1000 });
  assert.equal(calls.length, 1);
  return calls[0];
}
const banner = { positionId: 'resultpage.vip.banner.solar', imageUrl: 'https://example.invalid/ad.png' };
function popup(condition, goal) { return { positionId: 'solar.dialog.blank', data: { condition }, goal }; }
const promotions = [banner,
  popup('youxue.page.in', 'native://solar/purchaseVip?keyfrom=test'),
  popup('home.page.in', 'native://openWebView?url=' + encodeURIComponent('https://xyst.yuanfudao.com/h5/solar-web-activities/normal-activity-template.html?id=test')),
  popup('home.page.in', 'native://solar/openWebView?url=' + encodeURIComponent('https://xyst.yuanfudao.com/h5/solar-web-nuxt/tutoring-book')),
  popup('home.page.in', 'https://m.yuanfudao.com/primary/templates/package?id=test'),
  popup('vipPurchaseSuccess.page.in', 'https://m.yuanfudao.com/primary/templates/package')];
const retained = [null, 1, { positionId: 'home.function.cell.solar2', goal: 'native://solar/wrongBookHome' },
  { positionId: 'newHome.phone.function', goal: 'native://solar/calculator' },
  { positionId: 'question.video.loginTip.solar', customExt: 'original' },
  { positionId: 'oral.practice.history.banner.solar', goal: 'native://openWebView' },
  popup('home.page.in', 'native://solar/unrecognizedFeature'),
  popup('security.page.in', 'https://m.yuanfudao.com/primary/templates/package'),
  popup('home.page.in', 'native://openWebView?url=%INVALID'),
  popup('home.page.in', 'https://m.yuanfudao.com/primary/templates/package-other')];
test('remove six observed promotions; preserve other objects and order', () => {
  assert.deepEqual(JSON.parse(run(JSON.stringify([...promotions, ...retained])).body), retained);
});
test('unknown schemas, malformed JSON, errors, binary and no changes pass through', () => {
  for (const body of ['bad', '', '{}', 'null', '[]', JSON.stringify(retained), JSON.stringify({ data: promotions }), new Uint8Array([1, 2])]) assert.deepEqual(run(body), {});
  assert.deepEqual(run(JSON.stringify(promotions), endpoint, 403), {});
  assert.deepEqual(run(JSON.stringify(promotions), endpoint, 200, 'POST'), {});
});
test('URL rules bounded to observed activity endpoints', () => {
  for (const suffix of ['/solar-activity/iphone/activity-open/2', '/solar-activity/iphone/activity/2/161?test=1']) {
    const url = 'https://xyst.yuanfudao.com' + suffix;
    assert.ok(regex.test(url)); assert.equal(run(JSON.stringify([banner]), url).body, '[]');
  }
  for (const url of [endpoint + '0', endpoint + '/extra', endpoint.replace('xyst.', 'xyks.'), endpoint.replace('.com/', '.com.evil/'), 'https://xyst.yuanfudao.com/solar-vip/iphone/users/rights', 'https://xyst.yuanfudao.com/search/iphone/authenticate']) {
    assert.equal(regex.test(url), false); assert.deepEqual(run(JSON.stringify(promotions), url), {});
  }
});
test('second pass is idempotent', () => {
  const first = run(JSON.stringify([...promotions, ...retained]));
  assert.deepEqual(run(first.body), {});
});
