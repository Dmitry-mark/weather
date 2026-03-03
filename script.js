const API_KEY = '4742abd3a7862d20268ceb26b6f6df28';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const cityEl = document.getElementById('city');
const countryEl = document.getElementById('country');
const temperatureEl = document.getElementById('temperature');
const weatherDescEl = document.getElementById('weather-desc');
const weatherIconEl = document.getElementById('weather-icon');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const errorMessageEl = document.getElementById('error-message');


function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeather(latitude, longitude);
            },
            (error) => {
                console.warn('Браузерная геолокация не сработала, пробуем IP');
                getLocationByIP();
            }
        );
    } else {
        getLocationByIP();
    }
}

async function getLocationByIP() {
    try {
        // Вставьте сюда ваш токен от ipinfo.io
        const token = '14927da11d4fbf';
        const response = await fetch(`https://ipinfo.io/json?token=${token}`);
        if (!response.ok) throw new Error('Ошибка сети');
        const data = await response.json();
        if (!data.loc) throw new Error('Не удалось определить координаты');
        const [lat, lon] = data.loc.split(',').map(Number);
        fetchWeather(lat, lon);
    } catch (error) {
        console.warn('IP-геолокация не сработала:', error);
        showError('Не удалось определить местоположение. Введите город вручную.');
    }
}

// === ЗАПРОСЫ К OPENWEATHER ===
async function fetchWeather(lat, lon) {
    try {
        const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        console.error(error);
        showError('Ошибка загрузки погоды. Проверьте интернет и API-ключ.');
    }
}

async function fetchWeatherByCity(city) {
    try {
        const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ru`;
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) throw new Error('Город не найден');
            throw new Error('Ошибка сервера');
        }
        const data = await response.json();
        displayWeather(data);
        document.getElementById('city-input').value = '';
    } catch (error) {
        showError(error.message);
    }
}

// === ОТОБРАЖЕНИЕ ===
function displayWeather(data) {
    cityEl.textContent = data.name;
    countryEl.textContent = data.sys.country;
    temperatureEl.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDescEl.textContent = data.weather[0].description;
    humidityEl.textContent = data.main.humidity;
    windSpeedEl.textContent = data.wind.speed.toFixed(1);

    const iconCode = data.weather[0].icon;
    if (weatherIconEl) {
        weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIconEl.style.display = 'inline-block';
    }

    const timeOfDay = getTimeOfDay(data);
    document.body.className = timeOfDay;

    errorMessageEl.textContent = '';
}

function getTimeOfDay(weatherData) {
    const now = Math.floor(Date.now() / 1000);
    const sunrise = weatherData.sys.sunrise;
    const sunset = weatherData.sys.sunset;

    if (now < sunrise || now > sunset) {
        return 'night';
    } else {
        const dayLength = sunset - sunrise;
        const morningEnd = sunrise + dayLength * 0.25;
        const eveningStart = sunset - dayLength * 0.25;

        if (now < morningEnd) {
            return 'morning';
        } else if (now > eveningStart) {
            return 'evening';
        } else {
            return 'day';
        }
    }
}

function showError(message) {
    errorMessageEl.textContent = message;
    if (weatherIconEl) weatherIconEl.style.display = 'none';
    if (cityEl) cityEl.textContent = '--';
    if (countryEl) countryEl.textContent = '--';
    if (temperatureEl) temperatureEl.textContent = '--°C';
    if (weatherDescEl) weatherDescEl.textContent = '--';
    if (humidityEl) humidityEl.textContent = '--';
    if (windSpeedEl) windSpeedEl.textContent = '--';
}

// === ЗАПУСК ===
document.addEventListener('DOMContentLoaded', getLocation);

// === РУЧНОЙ ВВОД ===
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');

if (searchBtn && cityInput) {
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherByCity(city);
        } else {
            alert('Введите название города');
        }
    });
} else {
    console.warn('Элементы для ручного ввода не найдены');
}