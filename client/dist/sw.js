
'use strict';
/* global caches, Request, fetch, require, console, importScripts, Response */
var staticCacheName = 'pta-static-v5';
var allCaches = [
    staticCacheName
];
importScripts("/idb/lib/idb.js");
// importScripts('/js/sw-toolbox/sw-toolbox.js');
// importScripts('/lib/uuid4/index.js');
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
function openDatabase(dbname='restaurantdb', objectStoreName='rest', keyPath='url') {
    return self.idb.open(dbname, 1, function(upgradeDb) {
        upgradeDb.createObjectStore(objectStoreName, {
            keyPath: keyPath
        });
    });
}

/**
*/
function _storeData(data) {
    openDatabase()
        .then(function(db) {
            if (!db) {
                return;
            }

            var tx = db.transaction('rest', 'readwrite');
            var store = tx.objectStore('rest');
            store.put(data);
            return tx.complete;
        })
        .catch(error => console.log(error));
}

function _checkIdb(url) {
    return openDatabase()
        .then(function(db) {
            if (!db) {
                return;
            }
            var tx = db.transaction('rest');
            var store = tx.objectStore('rest');
            return store.get(url);
        })
        .catch(error => console.log(error));
}

function getAllRetryRequestsData(dbname, objectStoreName, keyPath) {
    return openDatabase(dbname, objectStoreName, keyPath)
        .then(function(db) {
            if (!db) {
                return;
            }
            var tx = db.transaction(objectStoreName);
            var store = tx.objectStore(objectStoreName);
            return store.getAll();
        })
        .then(function(data) {
            return data;
        })
        .catch(error => console.log('getAllRetryRequestsData error: ', error));
}

const deleteRequest = (key, objectStoreName) => {
    return openDatabase('requestsdb', objectStoreName, 'uuid')
        .then(function(db) {
            if (!db) {
                return;
            }

            var tx = db.transaction(objectStoreName, 'readwrite');
            var store = tx.objectStore(objectStoreName);
            store.delete(key);
            return tx.complete;
        })
        .catch(error => console.log(error));
}

const processReviewPostRequests = async function(event) {
    try {
        const requestsData = await getAllRetryRequestsData('requestsdb', 'reviewPostRequest', 'uuid');
        const response = await Promise.all(requestsData.map(async (request) => {
            const results = await fetch(request.url, {
                method     : request.method,
                body       : JSON.stringify(request.item),
                headers    : {
                    'Accept'           : 'application/json',
                    'Content-Type'     : 'application/json'
                }
            });
            // Clear the request from the outbox so it doesn't get processed again.
            await deleteRequest(request.uuid, 'reviewPostRequest');
            if (!event.source.id) return;
            const client = await clients.get(event.source.id);
            if (!client) return;
            // Send a message to the client.
            client.postMessage({
                name: 'reviewPostSyncComplete',
                item: request.item
            });
            return results;
        }));
    } catch (error) {
        console.log('background sync error: ', error);
    }
}

self.addEventListener('install', function(event) {
    console.log('installing');
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll(urlsToPrefetch).then(function() {
            });
        })
    );
});

self.addEventListener('activate', function(event) {
    console.log('activating');
    event.waitUntil(
        self.clients.claim(),
        openDatabase(),
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('pta-') && !allCaches.includes(cacheName);
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    var request = event.request.clone();
    if(request.method === 'POST') {
        event.respondWith(fetch(event.request));
        return;
    }

    if (request.url.startsWith('http://localhost:1337/')) {
        event.respondWith(serveRestaurantsDataNF(request));
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(function(response) {
                return response || fetch(event.request).then((response) => {
                    var resp = response.clone();
                    caches.open(staticCacheName).then(function(cache) {
                        cache.put(request, resp);
                    });
                    return response;
                });
            })
            .catch(error => console.log(error))
    );
});

self.addEventListener('message', function(event) {
    console.log('processReviewPostRequests');
    if (event.data && event.data.name === 'processReviewPostRequests') {
        processReviewPostRequests(event);
    }
});

function serveRestaurantsData(request) {
    return _checkIdb(request.url)
        .then(function(data) {
            console.log('serveRestaurantsData data: ', data);
            return data.text;
        })
        .then(function(data) {
            return new Response(data);
        })
        .catch(function(error) {
            console.log('serveRestaurantsData error: ', error);
            return fetchRestaurants(request);
        });
}

function serveRestaurantsDataNF(request) {
    return fetchRestaurants(request)
        .then(function(response) {
            if(!response) {
                console.log('serveRestaurantsDataNF response: ', response);
                return serveRestaurantsData(request);                    
            }
            return response;
        })
        .catch(function(error) {
            console.log('serveRestaurantsDataNF error: ', error);
            return serveRestaurantsData(request);
        });
}

function serveRestaurantByIdData(request) {
    return _checkIdb(request.url)
        .then(function(data) {
            // fetchStn(request)
            return new Response(data.text) ;
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
        // .catch(function(error) {
        //     console.log('Request failed', error);
        // });
}

function fetchStn(request) {
    stnUrlUse = '';
    stnUrlUse = request.url;
    return fetch(request)
        .then(status)
        .catch(function(error) {
            console.log('Request failed', error);
        });
}

function status(response) {
    console.log('status fn')
    var response2 = response.clone();
    response2.text()
        .then(function(text) {
            console.log('status fn response2.url', response2.url);
            // console.log('status fn text', text);
            _storeData({url: response2.url, text: text});
        });
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
    }
    return Promise.reject(new Error(response.statusText));
}
