const statusEl = document.getElementById('updated');
const currentTempEl = document.getElementById('currentTemp');
const currentWindEl = document.getElementById('currentWind');
const currentGustEl = document.getElementById('currentGust');
const currentConditionEl = document.getElementById('currentCondition');
const uvIndexEl = document.getElementById('uvIndex');
const airQualityEl = document.getElementById('airQuality');
const highTempEl = document.getElementById('highTemp');
const lowTempEl = document.getElementById('lowTemp');
const rainChanceEl = document.getElementById('rainChance');
const rainTimingEl = document.getElementById('rainTiming');
const nwsAlertsEl = document.getElementById('nwsAlerts');
const forecastCardsEl = document.getElementById('forecastCards');

const fixedLocation = {
  latitude: 35.473422,
  longitude: -97.503586,
};

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

function getWindDirectionLabel(degrees) {
  if (degrees == null || Number.isNaN(degrees)) return '';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return directions[index];
}

function getWindDirectionArrow(degrees) {
  if (degrees == null || Number.isNaN(degrees)) return '';
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return arrows[index];
}

function formatWind(speed, degrees) {
  if (speed == null || Number.isNaN(speed)) return '--';
  const directionLabel = getWindDirectionLabel(degrees);
  const directionArrow = getWindDirectionArrow(degrees);
  return directionLabel ? `${Math.round(speed)} mph ${directionArrow} ${directionLabel}` : `${Math.round(speed)} mph`;
}

function findClosestHourlyIndex(hourlyTimes, currentTime) {
  if (!Array.isArray(hourlyTimes) || hourlyTimes.length === 0) return -1;
  const currentMs = new Date(currentTime).getTime();
  let bestIndex = hourlyTimes.indexOf(currentTime);
  if (bestIndex !== -1) return bestIndex;

  let minDiff = Infinity;
  hourlyTimes.forEach((time, index) => {
    const diff = Math.abs(new Date(time).getTime() - currentMs);
    if (diff < minDiff) {
      minDiff = diff;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function formatAqiCategory(aqi) {
  if (aqi <= 50) return '(Good)';
  if (aqi <= 100) return '(Moderate)';
  if (aqi <= 150) return '(Unhealthy for sensitive groups)';
  if (aqi <= 200) return '(Unhealthy)';
  if (aqi <= 300) return '(Very unhealthy)';
  return '(Hazardous)';
}

function buildForecastCard(dateLabel, high, low, rainChance) {
  const item = document.createElement('div');
  item.className = 'forecast-item';
  item.innerHTML = `
    <div>
      <strong>${dateLabel}</strong>
      <div><span>High:</span> ${formatTemperature(high)}</div>
      <div><span>Low:</span> ${formatTemperature(low)}</div>
    </div>
    <div>
      <div style="font-size:0.85rem;color:#9bb8d3;margin-bottom:6px;">Rain chance</div>
      <div style="font-size:1.25rem">${formatPercentage(rainChance)}</div>
    </div>
  `;
  return item;
}

function getDailyLabel(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'America/Chicago',
  });
}

function formatRainTiming(hourly) {
  const now = new Date();
  const todayKey = now.toLocaleDateString('en-CA', {
    timeZone: 'America/Chicago',
  });

  const rainyHours = hourly.time
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time.startsWith(todayKey))
    .filter(({ index }) => {
      const chance = hourly.precipitation_probability[index];
      const precipitation = hourly.precipitation[index];
      return chance >= 40 || precipitation >= 0.02;
    })
    .map(({ time, index }) => ({
      date: new Date(time),
      index,
    }));

  if (rainyHours.length === 0) {
    return 'No rain expected today.';
  }

  const first = rainyHours[0].date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  });
  const last = rainyHours[rainyHours.length - 1].date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  });

  if (first === last) {
    return `Rain expected around ${first}.`;
  }
  return `Rain expected between ${first} and ${last}.`;
}

async function fetchWeather(latitude, longitude) {
  try {
    updateStatus('Loading forecast…');

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set(
      'hourly',
      'temperature_2m,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,winddirection_10m,uv_index,us_aqi'
    );
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
    if (!data.current_weather || !data.daily || !data.hourly) {
      throw new Error('Incomplete forecast response.');
    }

    const { current_weather: currentWeather, daily, hourly } = data;
    const currentIndex = findClosestHourlyIndex(hourly.time, currentWeather.time);

    currentTempEl.textContent = formatTemperature(currentWeather.temperature);
    currentWindEl.textContent = formatWind(
      currentWeather.windspeed,
      currentWeather.winddirection || (currentIndex >= 0 && hourly.winddirection_10m ? hourly.winddirection_10m[currentIndex] : null)
    );
    const hasGust = Array.isArray(hourly.wind_gusts_10m) && hourly.wind_gusts_10m.length > 0;
    const hasUv = Array.isArray(hourly.uv_index) && hourly.uv_index.length > 0;
    const hasAqi = Array.isArray(hourly.us_aqi) && hourly.us_aqi.length > 0;
    const hasWindDirHourly = Array.isArray(hourly.winddirection_10m) && hourly.winddirection_10m.length > 0;

    currentGustEl.textContent =
      currentIndex >= 0 && hasGust && hourly.wind_gusts_10m[currentIndex] != null
        ? `${Math.round(hourly.wind_gusts_10m[currentIndex])} mph`
        : '--';
    currentConditionEl.textContent = getConditionText(currentWeather.weathercode);
    uvIndexEl.textContent =
      currentIndex >= 0 && hasUv && hourly.uv_index[currentIndex] != null
        ? `${hourly.uv_index[currentIndex].toFixed(1)}`
        : '--';

    highTempEl.textContent = formatTemperature(daily.temperature_2m_max[0]);
    lowTempEl.textContent = formatTemperature(daily.temperature_2m_min[0]);
    rainChanceEl.textContent = formatPercentage(daily.precipitation_probability_max[0]);

    const aqiValue = currentIndex >= 0 && hasAqi ? hourly.us_aqi[currentIndex] : null;
    airQualityEl.textContent =
      aqiValue != null
        ? `${Math.round(aqiValue)} ${formatAqiCategory(Math.round(aqiValue))}`
        : '--';

    rainTimingEl.textContent = formatRainTiming(hourly);

    forecastCardsEl.innerHTML = '';
    daily.time.slice(1, 5).forEach((time, index) => {
      const forecastCard = buildForecastCard(
        getDailyLabel(time),
        daily.temperature_2m_max[index + 1],
        daily.temperature_2m_min[index + 1],
        daily.precipitation_probability_max[index + 1]
      );
      forecastCardsEl.appendChild(forecastCard);
    });

    const updatedAt = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    });
    const missing = [];
    if (!hasGust) missing.push('Gust');
    if (!hasUv) missing.push('UV');
    if (!hasAqi) missing.push('AQI');
    const missingText = missing.length ? ` — ${missing.join(', ')} unavailable` : '';
    updateStatus(`Updated at ${updatedAt}${missingText}`);

    fetchNwsAlerts(latitude, longitude);
  } catch (error) {
    console.error(error);
    updateStatus(`Unable to load weather: ${error.message}`, true);
    nwsAlertsEl.textContent = 'Unable to load NWS alerts.';
  }
}

async function fetchNwsAlerts(latitude, longitude) {
  try {
    const url = `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/geo+json',
      },
    });

    if (!response.ok) {
      throw new Error(`NWS alert request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.features) {
      throw new Error('NWS alert response missing features.');
    }

    if (data.features.length === 0) {
      nwsAlertsEl.textContent = 'No active NWS warnings or watches at this location.';
      return;
    }

    nwsAlertsEl.innerHTML = '';
    data.features.slice(0, 4).forEach((alert) => {
      const alertItem = document.createElement('div');
      const event = alert.properties.event || 'Alert';
      const headline = alert.properties.headline || event;
      const ending = alert.properties.ends
        ? new Date(alert.properties.ends).toLocaleString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Chicago',
          })
        : 'until further notice';
      alertItem.textContent = `${headline} — ${ending}`;
      nwsAlertsEl.appendChild(alertItem);
    });
  } catch (error) {
    console.error(error);
    nwsAlertsEl.textContent = 'Unable to load NWS alerts.';
  }
}

fetchWeather(fixedLocation.latitude, fixedLocation.longitude);

function isBusinessHours() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 17;
}

setInterval(() => {
  if (isBusinessHours()) {
    fetchWeather(fixedLocation.latitude, fixedLocation.longitude);
  }
}, 15 * 60 * 1000); // 15 minutes
