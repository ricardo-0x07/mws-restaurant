const idb = require('../idb/lib/idb')
const uuid = require('uuid4');
/**
 * Common database helper functions.
 */

module.exports = class DBHelper {
    constructor() {
        this.restaurants = [];
        this.restaurant = null;
        this.neighborhoods = [];
        this.cuisines = [];
        this.markers = [];
        this.map = null;
        const port = 1337;
        this.DATABASE_URL = `http://localhost:${port}/`;
    }
    openDatabase(dbname, objectStoreName, keyPath='uuid') {
        return idb.open(dbname, 1, function(upgradeDb) {
            console.log('open idb');
            upgradeDb.createObjectStore(objectStoreName, {
                keyPath: keyPath
            });
        });
    }
    storeReviewPostsRequests(data, objectStoreName) {
        console.log('storeReviewPostsRequests data', data);
        return this.openDatabase('requestsdb', objectStoreName, 'uuid')
            .then(function(db) {
                console.log('db', db);
                if (!db) {
                    return;
                }
        
                var tx = db.transaction(objectStoreName, 'readwrite');
                var store = tx.objectStore(objectStoreName);
                store.put(data);
                return tx.complete;
            })
            .catch(function(error) {
                console.log(error);
            });
    }
    
        
    getAllData(dbname, objectStoreName, keyPath) {
        return this.openDatabase(dbname, objectStoreName, keyPath).then(function(db) {
            if (!db) {
                return;
            }
            var tx = db.transaction(objectStoreName);
            var store = tx.objectStore(objectStoreName);
            return store.getAll();
        });
    }
    getAllRetryRequestsData(objectStoreName) {
        return this.getAllData(objectStoreName)
            .then(function(data) {
                console.log('retryAllRequests data: ', data);
                return data.text;
            })
            .catch(function(error) {
                console.log(error);
            });
    }
            
    favoriteRestaurant(restaurantId, is_favourite) {
        return fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${is_favourite}`, {
            method: 'PUT',
            headers: { Accept: "application/json" }
        })
            .then(() => this.fetchRestaurants2())
            .catch(error => console.log("error: ", error));
    }
    createRestaurantReview(review) {
        return this.submitReviewPost(review)
            .catch((error)=> {
                console.log('error: ', error);
                return navigator.serviceWorker.ready
                    .then(registration => {
                        console.log('sync registration:', registration);
                        if ('sync' in registration) {
                            var request = {
                                uuid: uuid(),
                                method : 'POST',
                                url    : `http://localhost:1337/reviews/`,
                                item   : review
                            };
                            this.storeReviewPostsRequests(request, 'reviewPostRequest')     
                                .then(function() {
                                    // register the sync so that service worker can process
                                    return registration.sync.register('reviewPostRequest');
                                })
                        } else {
                            // the browser doesn't support background sync, so just attach a plain old handler
                            this.submitReviewPost(review);
                        }                    
                    });    
            });
    }
    submitReviewPost(review) {
        return fetch(`http://localhost:1337/reviews/`, {
            method: 'POST',
            headers: { Accept: "application/json" },
            body: JSON.stringify(review)
        });
    }
    fetchRestaurantReviews(id) {
        return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`, {
            headers: { Accept: "application/json" }
        })
            .then(res => res.json())
            .then(data => {
                return data;
            })
            .catch(error => console.log("error: ", error));
    }
    fetchRestaurants2() {
        if(this.restaurants.length > 0) {
            return Promise.resolve(this.restaurants);
        }
        return fetch(`http://localhost:1337/restaurants`, {
            headers: { Accept: "application/json" }
        })
            .then(res => {
                return res.json();
            })
            .then(data => {
                this.restaurants = data;
                return data;
            })
            .catch(error => console.log("error: ", error));
    }
    fetchRestaurantById2(id) {
        return fetch(`http://localhost:1337/restaurants/${id}`, {
            headers: { Accept: "application/json" }
        })
            .then(res => res.json())
            .then(data => {
                return data;
            })
            .catch(error => console.log("error: ", error));
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    fetchRestaurantByCuisine2(cuisine) {
        // Fetch all restaurants  with proper error handling
        return this.fetchRestaurants2()
            .then(restaurants => {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                return results;
            })
            .catch(error => console.log("error: ", error));
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    fetchRestaurantByNeighborhood2(neighborhood) {
        // Fetch all restaurants
        return this.fetchRestaurants2()
            .then(restaurants => {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                return results;
            })
            .catch(error => console.log("error: ", error));
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    fetchRestaurantByCuisineAndNeighborhood2(cuisine, neighborhood) {
        // Fetch all restaurants
        return this.fetchRestaurants2()
            .then(restaurants => {
                let results = restaurants;
                if (cuisine != "all") {
                    // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != "all") {
                    // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                return results;
            })
            .catch(error => console.log("error: ", error));
    }


    /**
     * Fetch all neighborhoods with proper error handling.
     */
    fetchNeighborhoods() {
    // Fetch all restaurants
        return this.fetchRestaurants2()
            .then(restaurants => {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map(
                    (v, i) => restaurants[i].neighborhood
                );
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter(
                    (v, i) => neighborhoods.indexOf(v) == i
                );
                return uniqueNeighborhoods;
            })
            .catch(error => console.log("error: ", error));
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    fetchCuisines2() {
    // Fetch all restaurants
        return this.fetchRestaurants2()
            .then(restaurants => {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter(
                    (v, i) => cuisines.indexOf(v) == i
                );
                return uniqueCuisines;
            })
            .catch(error => console.log("error: ", error));
    }


    /**
   * Restaurant page URL.
   */
    urlForRestaurant(restaurant) {
        return `/#restaurant?id=${restaurant.id}`;
    }

    /**
   * Restaurant image URL.
   */
    imageUrlForRestaurant(restaurant) {
        if(restaurant.photograp) {
            return `/img/${restaurant.photograph}.webp`;
        }
        return `/img/${restaurant.id}.webp`;
    }

    /**
   * Map marker for a restaurant.
   */
    mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: this.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP
        });
        return marker;
    }
}
