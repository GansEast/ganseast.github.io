/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["/css/style.css","94e1e738cc8d650956fdc11e73291d07"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300.eot","4d947a5ada872571c15847bcc1596a83"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300.svg","8bc99638e32d04d752e8e06af1f7253f"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300.ttf","e44ee71ebf60188f5a00c92ff0661313"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300.woff","83529935f3d69b9af2dbca97b92dd5bb"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300.woff2","a953d4eaff50e39cf67e0b79c84038fc"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300italic.eot","a605bc99b958b344e2f43f5b19a1e6c5"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300italic.svg","5c534e5b087ae56279a5ed1c45254116"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300italic.ttf","f5283ea521c055451aa3a7f08dc7ea4a"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300italic.woff","e82557b723347ab10f47ae191d4a4f83"],["/font/merriweather-v15-latin-ext_cyrillic-ext-300italic.woff2","a1683b768764303912c9f8dd3a06fdcb"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700.eot","184070ef056909a7983b98855d313c5e"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700.svg","8746e11e78b9d14a17aa8f7c1f3e69d8"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700.ttf","01d1677e091850886b4a79d2e45563bc"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700.woff","8f5b76f7697fa227edd403dcf2d83715"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700.woff2","32a4f019663228bd7f2f06af0f2471c2"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700italic.eot","1dd59bb07119411d59f5e11614740bc2"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700italic.svg","7b385f6c2dff61fa98599fe50b8fcad1"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700italic.ttf","dc5c14827332d6ebf93966f0c4b725fc"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700italic.woff","64dd46881b0bf75491b2fe40ad5ab4f1"],["/font/merriweather-v15-latin-ext_cyrillic-ext-700italic.woff2","be9685cc91d77b1d96216718c72c01e6"],["/font/merriweather-v15-latin-ext_cyrillic-ext-italic.eot","abcbd03f8e616f5eb786d43bc88b8756"],["/font/merriweather-v15-latin-ext_cyrillic-ext-italic.svg","dbddc136c76eb718a0dfe57619822c26"],["/font/merriweather-v15-latin-ext_cyrillic-ext-italic.ttf","edb98408efe47c4aab5b13bcb7cb486f"],["/font/merriweather-v15-latin-ext_cyrillic-ext-italic.woff","89424a1930d19438132df764e48f2f14"],["/font/merriweather-v15-latin-ext_cyrillic-ext-italic.woff2","71658f913f8cfef7fb77f68d1ff28a3d"],["/font/merriweather-v15-latin-ext_cyrillic-ext-regular.eot","5417d5a0996235cda66b493630aa5cc6"],["/font/merriweather-v15-latin-ext_cyrillic-ext-regular.svg","ea7b9924de12257123b652dab7c5fd41"],["/font/merriweather-v15-latin-ext_cyrillic-ext-regular.ttf","190ad01c56d8187bc8e7214b07f5ba34"],["/font/merriweather-v15-latin-ext_cyrillic-ext-regular.woff","c5d25ab8b7a2fd748899cceaf2a448d4"],["/font/merriweather-v15-latin-ext_cyrillic-ext-regular.woff2","66d3bd2853390f7e6353bc233f62980c"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-300.eot","ce086d22f4d8b8876d42fb82e0e158fc"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-300.svg","103684be690427963b4052d478055dc7"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-300.ttf","025b624d20d5016f1cce4663e10d94f2"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-300.woff","0df367cae490f5d7d8bfbb93faaf692a"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-300.woff2","d20a96461a284b55d6cc103ece04095b"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-700.eot","9293ab1df632f0ff71738c96ddcbcfbc"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-700.svg","32a554e0253104a6b26293dd08b6487e"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-700.ttf","d0fc30856a541539009e73c787a68bc1"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-700.woff","1ba168d9d52b060fd37af91530fe71d9"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-700.woff2","2f297e36edfaaf91fb5cb52d709b90a0"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-regular.eot","7a80f264628767c65808ea97a93d83aa"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-regular.svg","fe92fe0723c53b67bd62ce5af01f4b14"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-regular.ttf","b3488e8486d2b4e3a0666997f91c7ed9"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-regular.woff","d72a35d7cd316eadf5a46e96a106da51"],["/font/ubuntu-v10-latin-ext_cyrillic-ext-regular.woff2","2f4dd7708afa289fc4e197ad5e9d6636"],["/icons/android-icon-144x144.png","5c892c8fbda39b2c4912c9bcab676188"],["/icons/android-icon-192x192.png","da9112f09088de43eae42ca01b93d4bd"],["/icons/android-icon-36x36.png","cf77fffc40dc44e3e04100d8437f8f80"],["/icons/android-icon-48x48.png","d8360733b73472fdb45caf69a6de6d14"],["/icons/android-icon-512x512.png","6f377a09aa8b9d048091135adc73d31b"],["/icons/android-icon-72x72.png","6a6fd6470662cb77e03b142cd38f5af2"],["/icons/android-icon-96x96.png","df1214f90f58daf5f43a8d6f353577de"],["/icons/apple-icon-114x114.png","5b92a461e738ef56067431a80df36b56"],["/icons/apple-icon-120x120.png","ff1ddfb00b0d1d32fc19a1e31b145ba2"],["/icons/apple-icon-144x144.png","5c892c8fbda39b2c4912c9bcab676188"],["/icons/apple-icon-152x152.png","4416e53c7c5b8d93a33980c1463e21e0"],["/icons/apple-icon-180x180.png","e595be548f2671507828d29a4a89db47"],["/icons/apple-icon-57x57.png","8924d4ff5d876b2917b068a8497772db"],["/icons/apple-icon-60x60.png","47f1f84abdb00db951837e4c1edc1c6a"],["/icons/apple-icon-72x72.png","6a6fd6470662cb77e03b142cd38f5af2"],["/icons/apple-icon-76x76.png","4730d5dc47a7aefa91305d316758f0dc"],["/icons/apple-icon-precomposed.png","da9112f09088de43eae42ca01b93d4bd"],["/icons/apple-icon.png","da9112f09088de43eae42ca01b93d4bd"],["/icons/favicon-16x16.png","6c1b55116c149c82a4f2fa7cea42b187"],["/icons/favicon-32x32.png","f3b16fc4d777969cd0af262fc5a04990"],["/icons/favicon-96x96.png","df1214f90f58daf5f43a8d6f353577de"],["/icons/ms-icon-144x144.png","5c892c8fbda39b2c4912c9bcab676188"],["/icons/ms-icon-150x150.png","4ac4b335fa0e905c15f5608481536a7f"],["/icons/ms-icon-310x310.png","6850b1762f03881ad1f05d761dfeb60d"],["/icons/ms-icon-70x70.png","581b8cde985c26310210df3b96960098"],["/index.html","d22470e9b56b421c54e0f07176868fcd"],["/js/app.js","4841544fccdafffde141ffa92b3a0e1c"],["/sw.js","6f14705b0a85b459fea978895eaf8c25"]];
var cacheName = 'sw-precache-v3--' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function (originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function (originalResponse) {
    // If this is not a redirected response, then we don't have to do anything.
    if (!originalResponse.redirected) {
      return Promise.resolve(originalResponse);
    }

    // Firefox 50 and below doesn't support the Response.body stream, so we may
    // need to read the entire body to memory as a Blob.
    var bodyPromise = 'body' in originalResponse ?
      Promise.resolve(originalResponse.body) :
      originalResponse.blob();

    return bodyPromise.then(function(body) {
      // new Response() is happy when passed either a stream or a Blob.
      return new Response(body, {
        headers: originalResponse.headers,
        status: originalResponse.status,
        statusText: originalResponse.statusText
      });
    });
  };

var createCacheKey = function (originalUrl, paramName, paramValue,
                           dontCacheBustUrlsMatching) {
    // Create a new URL object to avoid modifying originalUrl.
    var url = new URL(originalUrl);

    // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
    // then add in the extra cache-busting URL parameter.
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
      url.search += (url.search ? '&' : '') +
        encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
  };

var isPathWhitelisted = function (whitelist, absoluteUrlString) {
    // If the whitelist is empty, then consider all URLs to be whitelisted.
    if (whitelist.length === 0) {
      return true;
    }

    // Otherwise compare each path regex to the path of the URL passed in.
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function(whitelistedPathRegex) {
      return path.match(whitelistedPathRegex);
    });
  };

var stripIgnoredUrlParameters = function (originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function(item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, false);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function(requests) {
    return requests.map(function(request) {
      return request.url;
    });
  }).then(function(urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return setOfCachedUrls(cache).then(function(cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, {credentials: 'same-origin'});
              return fetch(request).then(function(response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function(responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function() {
      
      // Force the SW to transition from installing -> active state
      return self.skipWaiting();
      
    })
  );
});

self.addEventListener('activate', function(event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.keys().then(function(existingRequests) {
        return Promise.all(
          existingRequests.map(function(existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function() {
      
      return self.clients.claim();
      
    })
  );
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = 'index.html';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '';
    if (!shouldRespond &&
        navigateFallback &&
        (event.request.mode === 'navigate') &&
        isPathWhitelisted([], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function(e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});







