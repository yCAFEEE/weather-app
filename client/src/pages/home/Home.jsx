import { useState, useEffect, useRef } from 'react';
import './Home.css';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/';

export default function Home(){
  const [city, setCity] = useState('');
  const [cityName, setCityName] = useState('');
  const [cities, setCities] = useState([]);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [units, setUnits] = useState('metric');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  const lastQueryRef = useRef({ city:'', lat:'', lon:'' })

  const [theme, setTheme] = useState (() =>{
    const savedTheme = localStorage.getItem('theme');

    if(savedTheme) return savedTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    if(theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => { setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light')) }
  
  const handleSubmit = async(e, overrideCity = city, overrideLat = lat, overrideLon = lon) => {
    if(e) e.preventDefault();

    lastQueryRef.current = { city: overrideCity, lat: overrideLat, lon: overrideLon }

    try{
      const response = await fetch(API, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ city: overrideCity, units, lat: overrideLat, lon: overrideLon }),
      });
      const data = await response.json();

      if(response.ok){
        setWeather(data.weather);
        setError(null);
        setCities([]);
        setLat('');
        setLon('');
        if(!overrideLat) setCityName('');
      }else{
        setWeather(null);
        setError(data.error);
      }
    } catch(err){
      console.log("Error: ", err);
      setError("Server connection failed");
      setWeather(null)
    }
  };

  useEffect(() => {
    const fetchCities = async () => {
      if(city.trim().length < 2){
        setCities([]);
        return;
      }
      
      try{
        const response = await fetch(`${API}search-cities/`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ city })
        });
        const data = await response.json();
        if(response.ok && data.cities){
          setCities(data.cities);
        }else{
          setCities([]);
        }
      }catch(err){
        console.log("Error fetching cities: ", err);
        setCities([]);
      }
    };

    const timer = setTimeout(() => {
      fetchCities();
    }, 300);

    return () => clearTimeout(timer);
  }, [city]);

  useEffect(() => {
    if(weather){
      const { city: lastCity, lat: lastLat, lon: lastLon } = lastQueryRef.current;
      handleSubmit(null, lastCity, lastLat, lastLon);
    }
  }, [units]);
  
  let localTimeDt;
  let sunriseDt;
  let sunsetDt;
  if(weather){
    localTimeDt = new Date((weather.dt + weather.timezone) * 1000);
    sunriseDt = new Date((weather.sunrise + weather.timezone) * 1000);
    sunsetDt = new Date((weather.sunset + weather.timezone) * 1000);
    var localTime = String(localTimeDt.getUTCHours()).padStart(2, '0') + ':' + String(localTimeDt.getUTCMinutes()).padStart(2, '0');
    var sunriseTime = String(sunriseDt.getUTCHours()).padStart(2, '0') + ':' + String(sunriseDt.getUTCMinutes()).padStart(2, '0');
    var sunsetTime = String(sunsetDt.getUTCHours()).padStart(2, '0') + ':' + String(sunsetDt.getUTCMinutes()).padStart(2, '0');
  }

  const tempSymbol = units === "metric" ? "°C" : "°F";
  return (
    <>
      <header>
        <div className='text-logo'>
          <h1 id='weather'>Weather</h1>
          <h1 id='app'>App</h1>
        </div>

        <button onClick={toggleTheme} id='toggle-theme-button'>{theme === 'light' ? '🌙' : '☀️'}</button>
        
        <form onSubmit={handleSubmit} id='search-form'>
          <input
            id='city-name'
            type='text' 
            placeholder='City name...'
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button id='get-weather-button' type='submit'>Get weather</button>
          {cities && (
            <div className='cities-suggestions-container'>
              {cities.map((c, idx) => (
                <button
                  key={idx} 
                  onClick={() => {
                    setCity('');
                    setCities([]);
                    setLat(c.lat);
                    setLon(c.lon);
                    setCityName(`${c.name}${c.state ? ` - ${c.state}` : ''}, ${c.country}`);
                    handleSubmit(null, `${c.name}, ${c.country}`, c.lat, c.lon);
                  }}
                >{c.name}{c.state ? ` - ${c.state}` : ''}, {c.country}</button>
              )) }
            </div>
          )}
        </form>
      </header>
      
      <main>
        {weather && (
          <div className='weather-container'>
            <div className="units-toggle">
              <button className={units === 'metric' ? 'active' : ''} onClick={() => setUnits('metric')}>°C</button>
              <button className={units === 'imperial' ? 'active' : ''}  onClick={() => setUnits('imperial')}>°F</button>
            </div>
            <h1>{cityName ? cityName : weather.city}</h1>
            <div className='temp-container'>
              <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="Weather icon" />
              <h1>{weather.temperature} {tempSymbol}</h1>
            </div>
            <div className='desc-container'>
              <h2>{weather.description}</h2>
            </div>
            <div className='local-time-container'>
              <h3>Local time: {localTime}</h3>
              <div className='sun-info'>
                <h3>🌅  Sunrise: {sunriseTime}</h3>
                <h3>🌇  Sunset: {sunsetTime}</h3>
              </div>
            </div>
            <div className='weather-overview-container'>
              <div id='humidity'>
                <p className='weather-label'>Humidity </p>
                <p className='weather-value'>{weather.humidity}%</p>
              </div>
              <div id='feel'>
                <p className='weather-label'>Feel </p>
                <p className='weather-value'>{weather.feelsLike} {tempSymbol}</p>
              </div>
              <div id='min-temp'>
                <p className='weather-label'>Min temperature </p>
                <p className='weather-value'>{weather.tempMin} {tempSymbol}</p>
              </div>
              <div id='max-temp'>
                <p className='weather-label'>Max temperature </p>
                <p className='weather-value'>{weather.tempMax} {tempSymbol}</p>
              </div>
              <div id='pressure'>
                <p className='weather-label'>Pressure </p>
                <p className='weather-value'>{weather.pressure} hPa</p>
              </div>
              {weather.visibility &&
                <div id='visibility'>
                  <p className='weather-label'>Visibility </p> 
                  <p className='weather-value'>{units === "metric" ? `${weather.visibility / 1000} km` : `${((weather.visibility / 1000) / 1.609).toFixed(2)} mi`}</p>
                </div>
              }
              <div id='wind'>
                <p className='weather-label'>Wind speed </p>
                <p className='weather-value'>{units === "metric" ? `${(weather.windSpeed * 3.6).toFixed(2)} km/h` : `${weather.windSpeed} mph`}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <h2>{error}</h2>
        )}
      </main>

      <footer>
        <div className='footer-container'>
          <p>Developed by <a href='https://github.com/yCAFEEE'>yCAFEEE</a> (Yuri Daniel).</p>
          <div className='openweather-credits'>
            <p>Powered by:</p>
            <a href='https://openweathermap.org/'><img src={theme === 'light' ? '/weather-app/OpenWeather-Logo.png' : '/weather-app/OpenWeather-Negative-Logo.png'}/></a>
          </div>
        </div>
      </footer>
    </>
  )
}