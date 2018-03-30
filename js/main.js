
require('./IndexController');
const Restaurants = require('./restaurants');
const Restaurant = require('./restaurant');
const DBHelper = require('./dbhelper');
import toastr from 'toastr';
window.isMain = true;
window.DBHelper = new DBHelper()

var restaurantsSection = document.getElementById('restaurants');
var restaurantSection = document.getElementById('restaurant');
var breadcrumb = document.getElementById('breadcrumb');
function loadContent() {
    var req = new XMLHttpRequest();
    req.open('GET', 'main.html.gz');
    req.addEventListener('load', function () {
        ('this.responseText: ', this.responseText);
    });
    req.send();
};

function loadMain() {
    restaurantSection.style.display='none';
    restaurantsSection.style.display='block';
    restaurantsSection.innerHTML = `
    <section role="application"  id="map-container">
      <div id="map"></div>
    </section>
    <section id="restaurants-section">
      <div class="filter-options">
        <h2>Filter Results</h2>
        <select aria-label="Filter Neighborhoods" id="neighborhoods-select" name="neighborhoods" onchange="restaurants.updateRestaurants()">
          <option value="all">All Neighborhoods</option>
        </select>
        <select aria-label="Filter Cuisines" id="cuisines-select" name="cuisines" onchange="restaurants.updateRestaurants()">
          <option value="all">All Cuisines</option>
        </select>
      </div>
      <div id="restaurants-scroll" class="results">
        <ul id="restaurants-list"></ul>
      </div>
    </section>
    `;
    breadcrumb.style.display = 'none';
    window.restaurants = new Restaurants();
    window.restaurants.fetchNeighborhoods()
        .then(() => window.restaurants.fetchCuisines());
    console.log("document.getElementById('map'): ", document.getElementById('map'));

    /**
     * Initialize Google map, called from HTML.
     */
    console.log('window.initMap', window.initMap);
    if(!window.initMap) {
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
    } else {
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
};
function loadDetails() {
    restaurantsSection.style.display='none';
    restaurantsSection.innerHTML='';
    restaurantSection.style.display='block';
    restaurantSection.innerHTML= `
        <section role="application" id="map-restaurant-container">
        <div id="map"></div>
        </section>
        <section id="restaurant-container">
        <h2 id="restaurant-name"></h2>
        <img id="restaurant-img">
        <p id="restaurant-cuisine"></p>
        <p id="restaurant-address"></p>
        <div class="actionWrapper" id="restaurantActionWrapper" ></div>
        <table id="restaurant-hours"></table>
        </section>
        <section id="reviews-container">
        <h3 id="reviews-title"></h3>
        <div id="review-form-container" class="newReviewWrapper"></div>
        <ul id="reviews-list"></ul>
        </section>
    `;
    window.scrollTo(0, 0);
    breadcrumb.style.display = 'block';
    window.restaurant = new Restaurant();    
    navigator.serviceWorker.addEventListener('message', (event) =>{
        console.log('reviewPostSyncComplete event: ', event);
        if (event.data && event.data.name) {
            if (event.data.name === 'reviewPostSyncComplete') {
                toastr.info(`Synced new review by ${name}`);
                window.restaurant.fillReviewsHTML({ id: event.data.item.restaurant_id })
            }
        }
    });
    window.addEventListener('online', function(event) {
        console.log('online navigator.serviceWorker', navigator.serviceWorker);
        var messageChannel = new MessageChannel();
        return navigator.serviceWorker.ready
            .then((reg) => {
                console.log('reg: ', reg);
                reg.active.postMessage({
                    name: 'processReviewPostRequests'
                }, [messageChannel.port2]);
            });
    });
    /**
     * Initialize Google map, called from HTML.
     */
    console.log('window.initMap', window.initMap);
    if(!window.initMap) {
        window.initMap = () => {
            window.restaurant.fetchRestaurantFromURL((error, restaurant) => {
                if (error) { // Got an error!
                    console.error('Got an error!: ', error);
                } else {
                    window.restaurant.map = new google.maps.Map(document.getElementById('map'), {
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
                window.restaurant.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 16,
                    center: restaurant.latlng,
                    scrollwheel: false
                });
                window.restaurant.fillBreadcrumb(restaurant);
                window.DBHelper.mapMarkerForRestaurant(restaurant, window.restaurant.map);
            }
        });
    }
};

window.addEventListener("hashchange",function(event){
    if(window.location.href === "http://localhost:8000/" || window.location.href === "http://localhost:8000/#") {
        loadMain()
    } else {
        loadDetails()
    }
});

if(window.location.href === "http://localhost:8000/" || window.location.href === "http://localhost:8000/#") {
    loadMain()
} else {
    loadDetails()
}