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
    }
    /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
    static get DATABASE_URL() {
        const port = 8000; // Change this to your server port
        return `http://localhost:${port}/data/restaurants.json`;
    //http://localhost:1337
    // const port = 1337;
    // return `http://localhost:${port}/restuarants`;
    }

    fetchRestaurants2() {
        if(this.restaurants.length > 0) {
            return Promise.resolve(this.restaurants);
        }
        return fetch(`http://localhost:1337/restaurants`, {
            headers: { Accept: "application/json" }
        })
            .then(res => res.json())
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
   * Fetch all restaurants.
   */
    fetchRestaurants(callback) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", this.DATABASE_URL);
        xhr.onload = () => {
            if (xhr.status === 200) {
                // Got a success response from server!
                const json = JSON.parse(xhr.responseText);
                const restaurants = json.restaurants;
                callback(null, restaurants);
            } else {
                // Oops!. Got an error from server.
                const error = `Request failed. Returned status of ${xhr.status}`;
                callback(error, null);
            }
        };
        xhr.send();
    }

    /**
   * Fetch a restaurant by its ID.
   */
    fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
        this.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) {
                    // Got the restaurant
                    callback(null, restaurant);
                } else {
                    // Restaurant does not exist in the database
                    callback("Restaurant does not exist", null);
                }
            }
        });
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
   * Fetch restaurants by a cuisine type with proper error handling.
   */
    fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
        this.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
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
   * Fetch restaurants by a neighborhood with proper error handling.
   */
    fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
        this.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
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
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
    fetchRestaurantByCuisineAndNeighborhood(
        cuisine,
        neighborhood,
        callback
    ) {
    // Fetch all restaurants
        this.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != "all") {
                    // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != "all") {
                    // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
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
   * Fetch all cuisines with proper error handling.
   */
    fetchCuisines(callback) {
    // Fetch all restaurants
        this.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter(
                    (v, i) => cuisines.indexOf(v) == i
                );
                callback(null, uniqueCuisines);
            }
        });
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
