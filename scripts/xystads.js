/* XiaoYuan Search Loon ad filter v0.1.0. No network, storage or credential logging. */
(function () {
  'use strict';
  var endpoint = /^https:\/\/xyst\.yuanfudao\.com\/solar-activity\/iphone\/(?:activity-open\/2|activity\/2\/\d+)\/?(?:\?|$)/i;
  function webDestination(goal) {
    if (typeof goal !== 'string') return '';
    if (/^https:\/\//i.test(goal)) return goal;
    if (!/^native:\/\/(?:solar\/)?openWebView(?:\?|$)/i.test(goal)) return '';
    var match = /[?&]url=([^&]*)/.exec(goal);
    if (!match) return '';
    try { return decodeURIComponent(match[1]); } catch (_) { return ''; }
  }
  function isPromotion(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    if (item.positionId === 'resultpage.vip.banner.solar') return true;
    if (item.positionId !== 'solar.dialog.blank' || !item.data) return false;
    var condition = item.data.condition;
    var goal = item.goal;
    if (condition === 'youxue.page.in' && typeof goal === 'string' &&
        /^native:\/\/solar\/purchaseVip(?:\?|$)/.test(goal)) return true;
    if (condition !== 'home.page.in' && condition !== 'vipPurchaseSuccess.page.in') return false;
    var destination = webDestination(goal);
    return /^https:\/\/m\.yuanfudao\.com\/primary\/templates\/package(?:[?#]|$)/.test(destination) ||
      (condition === 'home.page.in' &&
       /^https:\/\/xyst\.yuanfudao\.com\/h5\/(?:solar-web-activities\/normal-activity-template\.html|solar-web-nuxt\/tutoring-book)(?:[?#]|$)/.test(destination));
  }
  var result = {};
  try {
    if (typeof $request !== 'undefined' && typeof $response !== 'undefined' &&
        (!$request.method || $request.method.toUpperCase() === 'GET') &&
        endpoint.test($request.url || '') && Number($response.status) === 200 &&
        typeof $response.body === 'string') {
      var data = JSON.parse($response.body);
      if (Array.isArray(data)) {
        var filtered = data.filter(function (item) { return !isPromotion(item); });
        if (filtered.length !== data.length) result = { body: JSON.stringify(filtered) };
      }
    }
  } catch (_) { /* Unknown/malformed responses pass through unchanged. */ }
  $done(result);
})();
