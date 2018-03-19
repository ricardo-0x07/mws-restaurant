
require('./IndexController');
const Restaurants = require('./restaurants');
const Restaurant = require('./restaurant');
const DBHelper = require('./dbhelper');
window.isMain = true;
window.DBHelper = new DBHelper()

var restaurantsSection = document.getElementById('restaurants');
var restaurantSection = document.getElementById('restaurant');
var breadcrumb = document.getElementById('breadcrumb');

window.addEventListener("hashchange",function(event){
    if(window.location.href === "http://localhost:8000/" || window.location.href === "http://localhost:8000/#") {
        restaurantSection.style.display='none';
        restaurantsSection.style.display='block';
        breadcrumb.style.display = 'none';
        window.restaurants = new Restaurants();
        /**
         * Fetch neighborhoods and cuisines as soon as the page is loaded.
         */
        window.restaurants.fetchNeighborhoods();
        window.restaurants.fetchCuisines();

        /**
         * Initialize Google map, called from HTML.
         */
        window.initMap = () => {
            let loc = {
                lat: 40.722216,
                lng: -73.987501
            };
            window.restaurants.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 12,
                center: loc,
                scrollwheel: false
            });
            window.restaurants.updateRestaurants();
        }
        window.location.reload();
    }
    else {
        restaurantsSection.style.display='none';
        restaurantSection.style.display='block';
        window.scrollTo(0, 0);
        breadcrumb.style.display = 'block';
        window.restaurant = new Restaurant();

        /**
         * Initialize Google map, called from HTML.
         */
        if(!window.initMap) {
            window.initMap = () => {
                window.restaurant.fetchRestaurantFromURL((error, restaurant) => {
                    if (error) { // Got an error!
                        console.error('Got an error!: ', error);
                    } else {
                        window.restaurant.map = new google.maps.Map(document.getElementById('map-restaurant'), {
                            zoom: 16,
                            center: restaurant.latlng,
                            scrollwheel: false
                        });
                        window.restaurant.fillBreadcrumb(restaurant);
                        window.DBHelper.mapMarkerForRestaurant(restaurant, window.restaurant.map);
                    }
                });
            }
            
        } else {
            window.restaurant.fetchRestaurantFromURL((error, restaurant) => {
                if (error) { // Got an error!
                    console.error('Got an error!: ', error);
                } else {
                    window.restaurant.map = new google.maps.Map(document.getElementById('map-restaurant'), {
                        zoom: 16,
                        center: restaurant.latlng,
                        scrollwheel: false
                    });
                    window.restaurant.fillBreadcrumb(restaurant);
                    window.DBHelper.mapMarkerForRestaurant(restaurant, window.restaurant.map);
                }
            });
        }
        window.location.reload();
    }
});

if(window.location.href === "http://localhost:8000/" || window.location.href === "http://localhost:8000/#") {
    restaurantSection.style.display='none';
    restaurantsSection.style.display='block';
    breadcrumb.style.display = 'none';
    window.restaurants = new Restaurants();
    /**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
    document.addEventListener('DOMContentLoaded', (event) => {
        window.restaurants.fetchNeighborhoods()
            .then(() => window.restaurants.fetchCuisines());
    });

    /**
 * Initialize Google map, called from HTML.
 */
    window.initMap = () => {
        let loc = {
            lat: 40.722216,
            lng: -73.987501
        };
        window.restaurants.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 12,
            center: loc,
            scrollwheel: false
        });
        window.restaurants.updateRestaurants();
    }
}
else {
    restaurantsSection.style.display='none';
    restaurantSection.style.display='block';
    breadcrumb.style.display = 'block';
    window.restaurant = new Restaurant();

    /**
     * Initialize Google map, called from HTML.
     */
    window.initMap = () => {
        window.restaurant.fetchRestaurantFromURL((error, restaurant) => {
            if (error) { // Got an error!
                console.error('Got an error!: ', error);
            } else {
                window.restaurant.map = new google.maps.Map(document.getElementById('map-restaurant'), {
                    zoom: 16,
                    center: restaurant.latlng,
                    scrollwheel: false
                });
                window.restaurant.fillBreadcrumb(restaurant);
                window.DBHelper.mapMarkerForRestaurant(restaurant, window.restaurant.map);
            }
        });
    }
}
