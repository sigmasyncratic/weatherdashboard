# weatherdashboard

A simple weather forecast dashboard using the Open-Meteo API.

## Files

- `index.html` — the dashboard page
- `style.css` — styles for the UI
- `script.js` — Open-Meteo fetch logic and forecast rendering

## Usage

1. Open `index.html` in a browser.
2. The dashboard loads a forecast for Oklahoma City, OK by default.
3. Click **Fetch Forecast** to refresh the latest weather or edit the coordinates if needed.

## Notes

- Uses Open-Meteo public API with no API key required.
- Loads fixed coordinates for Oklahoma City, OK by default.
- Shows current conditions and a short multi-day forecast.
- Includes local background images in `assets/` so the dashboard can be deployed to GitHub Pages without relying on external image hosting.

## GitHub Pages

1. Push this repository to GitHub.
2. In GitHub, open the repository settings and go to **Pages**.
3. Select the `main` branch and `/ (root)` folder as the source.
4. Save and wait a minute for GitHub Pages to publish.

The dashboard will then be available at the published Pages URL, and the background images will load from the repository assets.

### Optional custom domain

If you want a custom domain, create a `CNAME` file in the repo root containing your domain (for example `dashboard.example.com`), then configure your DNS to point to GitHub Pages. GitHub Pages will automatically use that domain once DNS is set correctly.
