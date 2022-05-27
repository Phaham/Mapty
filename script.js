'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// 💎---------------------------------Using Geo Location API -------------------------------------------💎
/*
navigator.geolocation.getCurrentPosition(function(){}, function(){});
   📌 This takes 2 arguments first one for when it gets current position and second one for when it doesn't get current coordinates(display error message)
*/

// let map, mapEvent;
/*
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        map = L.map('map').setView(coords, 13);//second parameter is for zoom of map when it first appears

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {// => fr/hot -> shows different theme of tiles of map(map is made of tiles)
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // L.marker(coords).addTo(map)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();


        // 📌 getting coordinates of that position where user clicks (by adding eventlistener from leaflet library) ->
        map.on('click', function (mapE) {
            mapEvent = mapE;
            // 📌 Displaying form when user click on map ->
            form.classList.remove('hidden');
            inputDistance.focus();//Now cursor will already in distance filling section

        });
    }, function () {
        alert('Could not get your position');
    })
};
*/
/* 📌 any variable that is global in any script will be available to all the other scripts
       while as long as they appear after that script
*/
// 📌 Submitting form when user hits enter ->


// 💎 Workout classes ->

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords, distance, duration) {
        // this.date = ...(something)
        // this.id = ...(something) use a library to add id's(we're not using a library here)

        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
    _setDescription() {
        // prettier-ignore -> use this to ignore prettier for next line
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()} ${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    // counting no. of clicks on a prticular workout
    click() {
        this.clicks++;
    }
}
class Running extends Workout {
    type = 'runing';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        // return this.pace;
    }
}
class cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        // this.type = 'cycling';
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        // Km/h
        this.speed = this.distance / (this.duration / 60);
        // return this.speed;
    }
}
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycle1 = new cycling([39, -12], 27, 95, 523);
// console.log(run1, cycle1);


// 💎 ------------------------------------- Project Architecture ------------------------------------------ 💎
class App {
    #map;
    #mapEvent;
    #mapZoomllevel = 13;
    #workouts = [];

    constructor() {//it is the constructor which firstly executed as application loads
        this._getPosition();

        // Get data from local storage ->
        this._getLocalStorage();

        /*📌 an event handler function will always have the this keyword of the dumb element onto which it is attached. */
        form.addEventListener('submit', this._newWorkout.bind(this));

        //when we change workout in form all others units will be changed
        inputType.addEventListener('change', this._toggleElevationField);

        //move to that position where user clicks workout in list
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition() {

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('Could not get your position');
            })
        };
    }
    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoomllevel);//second parameter is for zoom of map when it first appears

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {// => fr/hot -> shows different theme of tiles of map(map is made of tiles)
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // L.marker(coords).addTo(map)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();


        // 📌 getting coordinates of that position where user clicks (by adding eventlistener from leaflet library) ->
        this.#map.on('click', this._showform.bind(this));
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }

    _showform(mapE) {
        this.#mapEvent = mapE;
        // 📌 Displaying form when user click on map ->
        form.classList.remove('hidden');
        inputDistance.focus();//Now cursor will already in distance filling section
    }
    _hideForm() {
        // Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        // hide the form
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e) {

        // check if data is valid
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // If workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (
                // !Number.isFinite(distance) || 
                // !Number.isFinite(duration) || 
                // !Number.isFinite(cadence)
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            ) {
                return alert('Input must be +ve number');
            }
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        // If workout cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)) {

                return alert('Input must be +ve number');
            }
            workout = new cycling([lat, lng], distance, duration, elevation);
        }

        // Add new object to workout array
        this.#workouts.push(workout);

        // render workout on map as marker
        this._renderWorkoutMarker(workout);
        // render workout on list 
        this._renderWorkout(workout);
        // Hide form + clear input fields
        this._hideForm();

        // 📌 Setting local storage ->
        this._setLocalStorage();

    }
    _renderWorkoutMarker(workout) {
        // Display marker -
        //const { lat, lng } = this.#mapEvent.latlng;//latlng is name of property which contains coordinates of clicked point in leaflet
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({ // read documentation of leaflet to set more properties
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`)
            .openPopup();
    }
    _renderWorkout(workout) {
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;
        if (workout.type === 'running') {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }
        if (workout.type === 'cycling') {
            html += `<div class="workout__details">
           <span class="workout__icon">⚡️</span>
           <span class="workout__value">${workout.speed.toFixed(1)}</span>
           <span class="workout__unit">km/h</span>
         </div>
         <div class="workout__details">
           <span class="workout__icon">⛰</span>
           <span class="workout__value">${workout.elevationGain}</span>
           <span class="workout__unit">m</span>
         </div>
       </li>`;
            form.insertAdjacentHTML('afterend', html);
        }
    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        // console.log(workoutEl);
        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

        // setView -> leaflet property
        this.#map.setView(workout.coords, this.#mapZoomllevel, {//In 3rd argument we can pass object of options
            animate: true,
            pan: {
                duration: 1,
            }
        });
        // 📌 using the public interface ->
        // workout.click();
    }

    //📌 Local storage ->
    /*Local storage is a simple key value store, and so we need a key and we need a simple value,
    
    which must also be a string. But we can convert an object to a string by doing -> JSON.stringify.

    To convert string again into object we use -> JSON.parse()

    local storage is a very simple API. And so it is only advised to use for small amounts of data, 

    That's because local storage is blocking,
*/
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);
        if (!data) return;
        this.#workouts = data;//in starting workouts array is empty but now it takes data from local storage

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }
    // removing workouts from local storage ->
    reset() {
        localStorage.removeItem('workouts');
        location.reload();// 📌 it reloads the page
    }
}
const app = new App();
