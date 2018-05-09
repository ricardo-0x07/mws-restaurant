require('./IndexController');
const DBHelper = require('./dbhelper');
const LazyLoad = require('vanilla-lazyload');
const moment = require('moment');
const toastr = require('toastr');

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
        // image.setAttribute("data-src", this.dBHelper.imageUrlForRestaurant(restaurant)); //= this.dBHelper.imageUrlForRestaurant(restaurant);
        image.src = this.dBHelper.imageUrlForRestaurant(restaurant);
        image.alt = restaurant.name + ' Restaurant';
        const cuisine = document.getElementById('restaurant-cuisine');
        cuisine.innerHTML = restaurant.cuisine_type;
        this.fillActionWrapper(restaurant);
        let switchInput = document.getElementById(`${restaurant.id}`);
        switchInput.checked = (restaurant.is_favorite == "true");
        switchInput.addEventListener('click', (event) => {
            this.dBHelper.favoriteRestaurant(event.target.id, event.target.checked)
        })

        // fill operating hours
        if (restaurant.operating_hours) {
            this.fillRestaurantHoursHTML(restaurant.operating_hours);
        }
        // fill reviews
        this.fillReviewsHTML(restaurant);
        var myLazyLoad2 = new LazyLoad()        
    }

    fillActionWrapper(restaurant) {
        const restaurantActionWrapper = document.getElementById('restaurantActionWrapper');
        restaurantActionWrapper.innerHTML = `
            <label class="switch"><input type="checkbox" id=${restaurant.id} > <span class="slider round"></span></label>`;
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
    createRestaurantReview(restaurant) {
        const reviewForm = document.getElementById('review-form');
        const submitBtn = document.getElementById('submitBtn');
        const name = document.getElementById('name'); 
        const rating = document.getElementById('rating'); 
        const comments = document.getElementById('comments');
        if(reviewForm.checkValidity()) {
            const review = {
                name: name.value,
                rating: rating.value,
                comments: comments.value,
                restaurant_id: restaurant.restaurant.id,
            };
            this.dBHelper.createRestaurantReview(review)
                .then(() => {
                    name.value = ''; 
                    rating.value = ''; 
                    comments.value = ''; 
                    document.getElementById('newReviewForm').style.display = 'none';
                    review['createdAt'] = new Date();
                    this.fillReviewsHTML(restaurant.restaurant, review);           
                })
        }
    }
    updateRating(value) {
        document.getElementById('rating').value = value;
    }
    /**
     * Create all reviews HTML and add them to the webpage.
     */
    fillReviewsHTML(restaurant, newReview = null) {
        this.dBHelper.fetchRestaurantReviews(restaurant.id)
            .then(reviews => {
                if(newReview != null) {
                    reviews.push(newReview);
                }
                const container = document.getElementById('reviews-container');
                const title = document.getElementById('reviews-title');
                title.innerHTML = 'Reviews';
                const form = `
                <div style="width: 100%">
                    <button id="newReviewBtn" raised> New Review
                    </button><br/>
                    <div style="width: 100%; display: none; padding-top: 16px;" id="newReviewForm" >         
                        <h4><span class="label label-info" style="width: 100%; color: #333;">Review ${restaurant.name} Restuarant</span></h4>
                        <form style="width: 100%; margin: auto;" id="review-form">
                            <div class="form-group">
                                <label for="comments" class="form-label">Comments:</label>
                                <textarea aria-required="true" aria-describedby="commenthelp" autofocus required minlength="6" class="form-control" type="text" name="comments" id="comments" placeholder="Kindly type your review comment here."></textarea>
                                <span id="comments-help" class="help">Kindly enter a review at least 6 charaters long</span>                
                            </div>              
                            <div class="form-group">
                                <label for="name" class="form-label">Name:</label>
                                <input aria-required="true" aria-describedby="name-help" required minlength="2" class="form-control" type="text" name="name" id="name" placeholder="Kindly enter your name" >
                                <span id="name-help" class="help">Kindly enter a name at least two charaters long</span>                
                            </div>
                            <div class="form-group">
                                <label for="rating" class="form-label">Ratings:
                                    <select required  id="rating" name="rating" onchange="restaurant.updateRating(value)">
                                        <option value="1">1 Star</option>
                                        <option value="2">2 Star</option>
                                        <option value="3">3 Star</option>
                                        <option value="4">4 Star</option>
                                        <option value="5">5 Star</option>
                                    </select>
                                </label>
                            </div>
                            <br/>
                            <div>
                                <button id="submitBtn" raised type="button" onClick="restaurant.createRestaurantReview(restaurant)">Submit Review</button>
                            </div>              
                        </form>
                    </div>
                </div>`;
                const formDiv = document.getElementById('review-form-container');
                formDiv.className = "newReviewWrapper";
                formDiv.innerHTML = form;
                const newReviewBtn = document.getElementById('newReviewBtn');
                newReviewBtn.addEventListener('click', function() {
                    document.getElementById('newReviewForm').style.display = 'block';
                });
                const name = document.getElementById('name'); 
                const rating = document.getElementById('rating'); 
                const comments = document.getElementById('comments');
                const submitBtn = document.getElementById('submitBtn'); 
                submitBtn.disabled = true;
                name.addEventListener("input", function (event) {
                    if (name.validity.valid && rating.validity.valid) {
                        submitBtn.disabled = false;
                    }
                }, false);
        
                rating.addEventListener("input", function (event) {
                    if (name.validity.valid && rating.validity.valid) {
                        submitBtn.disabled = false;
                    }
                }, false);
        
                if (!reviews) {
                    const noReviews = document.createElement('p');
                    noReviews.innerHTML = 'No reviews yet!';
                    container.appendChild(noReviews);
                    return;
                }
                const ul = document.getElementById('reviews-list');
                ul.innerHTML = '';
                reviews.forEach(review => {
                    ul.appendChild(this.createReviewHTML(review));
                });
                container.appendChild(ul);        
            })
            .catch(error => console.log(error));
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
        let createdAt = new Date(review.createdAt);
        date.innerHTML = moment(createdAt).format("MMM-DD-YYYY");
        li.appendChild(date);

        const rating = document.createElement('p');
        const unchecked = "fa fa-star";
        const checked = "fa fa-star checked";
        const stars = `
                <span class="${review.rating >= 1 ? checked : unchecked}"></span>
                <span class="${review.rating >= 2 ? checked : unchecked}"></span>
                <span class="${review.rating >= 3 ? checked : unchecked}"></span>
                <span class="${review.rating >= 4 ? checked : unchecked}"></span>
                <span class="${review.rating >= 5 ? checked : unchecked}"></span>
        `;
        rating.innerHTML = `Rating: ${stars}`;
        // rating.innerHTML = `Rating: ${review.rating}`;
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
