
const DBHelper = require('./dbhelper');
const LazyLoad = require('vanilla-lazyload');
module.exports = class Restaurants {
    constructor() {
        this.restaurants = [];
        this.neighborhoods = [];
        this.cuisines = [];
        this.markers = [];
        this.map = null;
        this.dBHelper = new DBHelper();
    }
    /**
     * Fetch all neighborhoods and set their HTML.
     */
    fetchNeighborhoods() {
        return this.dBHelper.fetchNeighborhoods()
            .then(neighborhoods => {
                this.neighborhoods = neighborhoods;
                return this.fillNeighborhoodsHTML(neighborhoods);
            })
            .catch(error => console.log('errors: ', error));
    }

    /**
     * Set neighborhoods HTML.
     */
    fillNeighborhoodsHTML(neighborhoods ) {
        const select = document.getElementById('neighborhoods-select');
        neighborhoods.forEach(neighborhood => {
            const option = document.createElement('option');
            option.innerHTML = neighborhood;
            option.value = neighborhood;
            select.append(option);
        });
    }

    /**
     * Fetch all cuisines and set their HTML.
     */
    fetchCuisines() {
        this.dBHelper.fetchCuisines2()
            .then(cuisines => {
                cuisines = cuisines;
                this.fillCuisinesHTML(cuisines);
            })
            .catch(error => console.log('error: ', error));
    }

    /**
     * Set cuisines HTML.
     */
    fillCuisinesHTML(cuisines) {
        const select = document.getElementById('cuisines-select');

        cuisines.forEach(cuisine => {
            const option = document.createElement('option');
            option.innerHTML = cuisine;
            option.value = cuisine;
            select.append(option);
        });
    }

    /**
     * Update page and map for current restaurants.
     */
    updateRestaurants() {
        const cSelect = document.getElementById('cuisines-select');
        const nSelect = document.getElementById('neighborhoods-select');

        const cIndex = cSelect.selectedIndex;
        const nIndex = nSelect.selectedIndex;

        const cuisine = cSelect[cIndex].value;
        const neighborhood = nSelect[nIndex].value;

        this.dBHelper.fetchRestaurantByCuisineAndNeighborhood2(cuisine, neighborhood)
            .then(restaurants => {
                this.resetRestaurants(restaurants);
                this.fillRestaurantsHTML(restaurants);
            })
            .catch(error => console.log('error: ', error));
    }

    /**
     * Clear current restaurants, their HTML and remove their map markers.
     */
    resetRestaurants(restaurants) {
        // Remove all restaurants
        this.restaurants = [];
        const ul = document.getElementById('restaurants-list');
        ul.innerHTML = '';

        // Remove all map markers
        this.markers.forEach(m => m.setMap(null));
        this.markers = [];
        this.restaurants = restaurants;
    }

    /**
     * Create all restaurants HTML and add them to the webpage.
     */
    fillRestaurantsHTML(restaurants) {
        const ul = document.getElementById('restaurants-list');
        restaurants.forEach(restaurant => {
            ul.append(this.createRestaurantHTML(restaurant));
            let switchInput = document.getElementById(`${restaurant.id}`);
            switchInput.checked = (restaurant.is_favorite == 'true');
            switchInput.addEventListener('click', (event) => {
                this.dBHelper.favoriteRestaurant(event.target.id, event.target.checked)
            })
        });


        function logElementEvent(eventName, element) {
            console.log(new Date().getTime(), eventName, element.getAttribute('data-src'));
        }
        function logEvent(eventName, elementsLeft) {
            console.log(new Date().getTime(), eventName, elementsLeft + " images left");
        }
        var myLazyLoad2 = new LazyLoad()

        this.addMarkersToMap(restaurants);
    }

    /**
     * Create restaurant HTML.
     */
    createRestaurantHTML(restaurant) {
        const li = document.createElement('li');

        const image = document.createElement('img');
        image.className = 'restaurant-img lazyload';
        image.setAttribute("data-src", this.dBHelper.imageUrlForRestaurant(restaurant)); //= this.dBHelper.imageUrlForRestaurant(restaurant);
        image.src = '';
        image.alt = restaurant.name + ' Restaurant';
        li.append(image);

        const name = document.createElement('h2');
        name.innerHTML = restaurant.name;
        li.append(name);

        const neighborhood = document.createElement('p');
        neighborhood.innerHTML = restaurant.neighborhood;
        li.append(neighborhood);

        const address = document.createElement('p');
        address.innerHTML = restaurant.address;
        li.append(address);

        // const more = document.createElement('a');
        // more.innerHTML = 'View Details';
        // more.href = this.dBHelper.urlForRestaurant(restaurant);
        // li.append(more)

        const actionWrapper = document.createElement('div');
        actionWrapper.className = 'actionWrapper';
        actionWrapper.innerHTML = `
            <a href=/#restaurant?id=${restaurant.id} class="details">View Details</a>
            <div style="display: flex; flex-direction: row; margin-left: 1em; align-items: center;
            justify-content: space-around;">
                <span style="margin-top: 1em">Favorite:</span>
                <label class="switch" aria-labwl="Favorite"> <input type="checkbox" id=${restaurant.id} > <span class="slider round"></span></label>
            </div>
            `;
        li.appendChild(actionWrapper);

        return li
    }

    /**
     * Add markers for current restaurants to the map.
     */
    addMarkersToMap (restaurants) {
        restaurants.forEach(restaurant => {
        // Add marker to the map
            const marker = this.dBHelper.mapMarkerForRestaurant(restaurant, this.map);
            google.maps.event.addListener(marker, 'click', () => {
                window.location.href = marker.url
            });
            this.markers.push(marker);
        });
    }
}
