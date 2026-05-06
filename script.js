const currentLocationBtn = document.getElementById('currentLocationBtn');
const fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
const statusEl = document.getElementById('status');

const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const currentTempEl = document.getElementById('currentTemp');
const currentWindEl = document.getElementById('currentWind');
const currentConditionEl = document.getElementById('currentCondition');
const highTempEl = document.getElementById('highTemp');
const lowTempEl = document.getElementById('lowTemp');
const rainChanceEl = document.getElementById('rainChance');
const forecastCardsEl = document.getElementById('forecastCards');

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

function updateStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ffb4b4' : '#d0e2ff';
}

function formatTemperature(value) {
  return `${Math.round(value)}°F`;
}

function formatPercentage(value) {
  return `${Math.round(value)}%`;
}

function getConditionText(code) {
  return weatherCodeMap[code] || 'Unknown';
}

function buildForecastCard(date, high, low, rainChance) {
  const item = document.createElement('div');
  item.className = 'forecast-item';
  item.innerHTML = `
    <div>
      <strong>${date}</strong>
      <div><span>High:</span> ${formatTemperature(high)}</div>
      <div><span>Low:</span> ${formatTemperature(low)}</div>
    </div>
    <div>${formatPercentage(rainChance)}</div>
  `;
  return item;
}

async function fetchWeather(latitude, longitude) {
  try {
    updateStatus('Loading forecast…');

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('hourly', 'temperature_2m,rain,relative_humidity_2m,dew_point_2m,precipitation_probability,precipitation,uv_index');
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    url.searchParams.set('timezone', 'America/Chicago');
    url.searchParams.set('wind_speed_unit', 'mph');
    url.searchParams.set('temperature_unit', 'fahrenheit');
    url.searchParams.set('precipitation_unit', 'inch');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Forecast request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.current_weather || !data.daily) {
      throw new Error('Incomplete forecast response.');
    }

    const { current_weather: currentWeather, daily } = data;

    currentTempEl.textContent = formatTemperature(currentWeather.temperature);
    currentWindEl.textContent = `${Math.round(currentWeather.windspeed)} km/h`;
    currentConditionEl.textContent = getConditionText(currentWeather.weathercode);

    highTempEl.textContent = formatTemperature(daily.temperature_2m_max[0]);
    lowTempEl.textContent = formatTemperature(daily.temperature_2m_min[0]);
    rainChanceEl.textContent = formatPercentage(daily.precipitation_probability_max[0]);

    forecastCardsEl.innerHTML = '';
    daily.time.slice(1, 5).forEach((time, index) => {
      const forecastCard = buildForecastCard(
        time,
        daily.temperature_2m_max[index + 1],
        daily.temperature_2m_min[index + 1],
        daily.precipitation_probability_max[index + 1]
      );
      forecastCardsEl.appendChild(forecastCard);
    });

    updateStatus(`Forecast loaded for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}.`);
  } catch (error) {
    console.error(error);
    updateStatus(`Unable to load weather: ${error.message}`, true);
  }
}

currentLocationBtn.addEventListener('click', async () => {
  if (!navigator.geolocation) {
    updateStatus('Geolocation is not available in your browser.', true);
    return;
  }

  updateStatus('Requesting your location…');
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      latitudeInput.value = latitude.toFixed(4);
      longitudeInput.value = longitude.toFixed(4);
      fetchWeather(latitude, longitude);
    },
    (error) => {
      updateStatus(`Location error: ${error.message}`, true);
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

fetchWeatherBtn.addEventListener('click', () => {
  const latitude = parseFloat(latitudeInput.value);
  const longitude = parseFloat(longitudeInput.value);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    updateStatus('Please enter valid latitude and longitude values.', true);
    return;
  }
  fetchWeather(latitude, longitude);
});

fetchWeather(parseFloat(latitudeInput.value), parseFloat(longitudeInput.value));

// Auto-refresh every 15 minutes during business hours (7am-6pm Mon-Fri)
function isBusinessHours() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 7 && hour < 18;
}

setInterval(() => {
  if (isBusinessHours()) {
    const lat = parseFloat(latitudeInput.value);
    const lon = parseFloat(longitudeInput.value);
    if (!isNaN(lat) && !isNaN(lon)) {
      fetchWeather(lat, lon);
    }
  }
}, 15 * 60 * 1000); // 15 minutes
