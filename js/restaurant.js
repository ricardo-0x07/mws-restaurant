require('./IndexController');
const DBHelper = require('./dbhelper');
const LazyLoad = require('vanilla-lazyload');

module.exports = class Restaurant {
    constructor() {
        this.restaurant = null;
        this.map = null;
        this.dBHelper = new DBHelper();
    }
    /**
     * Get current restaurant from page URL.
     */
    fetchRestaurantFromURL(callback) {
        if (this.restaurant) { // restaurant already fetched!
            callback(null, restaurant)
            return;
        }
        const id = this.getParameterByName('id');
        if (!id) { // no id found in URL
            const error = 'No restaurant id in URL'
            callback(error, null);
        } else {
            this.dBHelper.fetchRestaurantById2(id)
                .then(restaurant => {
                    this.restaurant = restaurant;
                    this.fillRestaurantHTML(restaurant);
                    callback(null, restaurant)
                    return restaurant;
                })
                .catch(error => console.log('error: ', error));
        }
    }

    /**
     * Create restaurant HTML and add it to the webpage
     */
    fillRestaurantHTML(restaurant) {
        const name = document.getElementById('restaurant-name');
        name.innerHTML = restaurant.name;

        const address = document.getElementById('restaurant-address');
        address.innerHTML = restaurant.address;

        const image = document.getElementById('restaurant-img');
        image.className = 'restaurant-img lazyload'
        image.setAttribute("data-src", this.dBHelper.imageUrlForRestaurant(restaurant)); //= this.dBHelper.imageUrlForRestaurant(restaurant);
        image.src = '';
        image.alt = restaurant.name + ' Restaurant';
        const cuisine = document.getElementById('restaurant-cuisine');
        cuisine.innerHTML = restaurant.cuisine_type;

        // fill operating hours
        if (restaurant.operating_hours) {
            this.fillRestaurantHoursHTML(restaurant.operating_hours);
        }
        // fill reviews
        this.fillReviewsHTML(restaurant.reviews);
        var myLazyLoad2 = new LazyLoad()        
    }

    /**
     * Create restaurant operating hours HTML table and add it to the webpage.
     */
    fillRestaurantHoursHTML(operatingHours) {
        const hours = document.getElementById('restaurant-hours');
        for (let key in operatingHours) {
            const row = document.createElement('tr');

            const day = document.createElement('td');
            day.innerHTML = key;
            row.appendChild(day);

            const time = document.createElement('td');
            time.innerHTML = operatingHours[key];
            row.appendChild(time);

            hours.appendChild(row);
        }
    }

    /**
     * Create all reviews HTML and add them to the webpage.
     */
    fillReviewsHTML(reviews) {
        const container = document.getElementById('reviews-container');
        const title = document.createElement('h3');
        title.innerHTML = 'Reviews';
        container.appendChild(title);

        if (!reviews) {
            const noReviews = document.createElement('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
        }
        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
            ul.appendChild(this.createReviewHTML(review));
        });
        container.appendChild(ul);
    }

    /**
     * Create review HTML and add it to the webpage.
     */
    createReviewHTML(review) {
        const li = document.createElement('li');
        const name = document.createElement('p');
        name.innerHTML = review.name;
        li.appendChild(name);

        const date = document.createElement('p');
        date.innerHTML = review.date;
        li.appendChild(date);

        const rating = document.createElement('p');
        rating.innerHTML = `Rating: ${review.rating}`;
        li.appendChild(rating);

        const comments = document.createElement('p');
        comments.innerHTML = review.comments;
        li.appendChild(comments);

        return li;
    }

    /**
     * Add restaurant name to the breadcrumb navigation menu
     */
    fillBreadcrumb(restaurant) {
        const insert = document.getElementById('insert');
        insert.outerHTML = `<li id="insert">${restaurant.name}</li>`;
    }

    /**
     * Get a parameter by name from page URL.
     */
    getParameterByName(name, url) {
        if (!url)
            url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
}
