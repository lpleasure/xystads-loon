/* XiaoYuan Search Loon splash filter v0.2.0. No network, storage or credential logging. */
(function () {
  'use strict';
  var endpoint = /^https:\/\/xyst\.yuanfudao\.com\/solar-sync\/iphone\/sync\/?(?:\?|$)/i;
  var blockedKey = 'homepageActivity';
  function withoutLength(headers) {
    var copy = {};
    for (var name in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, name) && name.toLowerCase() !== 'content-length') copy[name] = headers[name];
    }
    return copy;
  }
  var result = {};
  try {
    if (typeof $request !== 'undefined' && endpoint.test($request.url || '') &&
        String($request.method || '').toUpperCase() === 'POST' && typeof $request.body === 'string') {
      var data = JSON.parse($request.body);
      if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.keys) &&
          data.keys.indexOf(blockedKey) !== -1) {
        var keys = data.keys.filter(function (key) { return key !== blockedKey; });
        if (keys.length) {
          data.keys = keys;
          result = { headers: withoutLength($request.headers || {}), body: JSON.stringify(data) };
        } else {
          /* Encrypted response cannot be edited; answer the splash/home-activity sync with an empty body. */
          result = { response: { status: 200, headers: { 'Content-Type': 'application/octet-stream' }, body: '' } };
        }
      }
    }
  } catch (_) { /* Unknown/malformed requests pass through unchanged. */ }
  $done(result);
})();
