
'use strict';
/* global caches, Request, fetch, require, console, importScripts, Response */
var staticCacheName = 'pta-static-v5';
var allCaches = [
    staticCacheName
];
importScripts("/idb/lib/idb.js");
// importScripts('/js/sw-toolbox/sw-toolbox.js');
var urlsToPrefetch = [
    '/',
    '/sw.js',
    '/idb/lib/idb.js'
];

var urlUse = '';
var stnUrlUse = '';
/**
* @return - a promise that resolves to a DB
*/
function openDatabase() {
    return self.idb.open('restaurantdb', 1, function(upgradeDb) {
        upgradeDb.createObjectStore('rest', {
            keyPath: 'url'
        });
    });
}

/**
*/
function _storeData(data) {
    openDatabase().then(function(db) {
        if (!db) {
            return;
        }

        var tx = db.transaction('rest', 'readwrite');
        var store = tx.objectStore('rest');
        store.put(data);
        return tx.complete;
    });
}

function _checkIdb(url) {
    return openDatabase().then(function(db) {
        if (!db) {
            return;
        }
        var tx = db.transaction('rest');
        var store = tx.objectStore('rest');
        return store.get(url);
    });
}


self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll(urlsToPrefetch).then(function() {
            });
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        openDatabase(),
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('pta-') &&
                 !allCaches.includes(cacheName);
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    var request = event.request.clone();

    if (request.url.startsWith('http://localhost:1337/restaurants')) {
        event.respondWith(serveRestaurantsData(request));
        return;
    }

    event.respondWith(
        caches.match(request).then(function(response) {
            return response || fetch(event.request).then((response) => {
                var resp = response.clone();
                caches.open(staticCacheName).then(function(cache) {
                    cache.put(request, resp);
                });
                return response;
            });
        })
    );
});

self.addEventListener('sync', function(event) {
    if (event.tag === 'reviewPost') {
        // event.waitUntil(
        //     store.outbox('readonly').then(function (outbox) {
        //         return outbox.getAll();
        //     }).then(function (requests) {
        //         return Promise.all(requests.map(function (request) {
        //             return fetch(request.url, {
        //                 credential : 'include',
        //                 method     : request.method,
        //                 body       : JSON.stringify(request.item),
        //                 headers    : {
        //                     'Accept'           : 'application/json',
        //                     'Content-Type'     : 'application/json'
        //                 }
        //             }).then(function (response) {
        //                 return response.json();
        //             }).then(function (data) {
        //                 // Clear the request from the outbox so it doesn't get processed again.
        //                 return store.outbox('readwrite').then(function (outbox) {
        //                     return outbox.delete(request.uuid);
        //                 });
        //             });
        //         }));
        //     })
        // );
    }
});

function serveRestaurantsData(request) {
    return _checkIdb(request.url)
        .then(function(data) {
            return new Response(data.text);
        })
        .catch(function() {
            return fetchRestaurants(request);
        });
}

function serveRestaurantByIdData(request) {
    return _checkIdb(request.url)
        .then(function(data) {
            return new Response(data.text);
        })
        .catch(function() {
            return fetchStn(request);
        });
}

function fetchRestaurants(request) {
    urlUse = '';
    urlUse = request.url;
    return fetch(request)
        .then(status)
    // .then(text)
        .catch(function(error) {
            console.log('Request failed', error);
        });
}

function fetchStn(request) {
    stnUrlUse = '';
    stnUrlUse = request.url;
    return fetch(request)
        .then(status)
    // .then(text)
        .catch(function(error) {
            console.log('Request failed', error);
        });
}

function status(response) {
    var response2 = response.clone();
    response2.text()
        .then(function(text) {
            _storeData({url: response2.url, text: text});
        });
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
    }
    return Promise.reject(new Error(response.statusText));
}
