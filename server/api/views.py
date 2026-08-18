import requests
import os
from dotenv import load_dotenv
from django.http import JsonResponse
from .models import WeatherInfo
from django.views.decorators.csrf import csrf_exempt

load_dotenv()
API_KEY = os.getenv('API_KEY')

@csrf_exempt
def getWeather(request):
    weather = None
    error = None

    if request.method == "POST":
        city = request.POST.get("city", '').strip()
        lat = request.POST.get("lat", '').strip()
        lon = request.POST.get("lon", '').strip()
        units = request.POST.get("units", 'metric').strip().lower()

        if lat and lon:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units={units}"
        elif city:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units={units}"
        else:
            return JsonResponse({'error': "City name is empty."}, status = 400)

        try:
            resp = requests.get(url, timeout = 5)
            data = resp.json()

            if resp.status_code == 200:
                lat = data['coord']['lat']
                lon = data['coord']['lon']
                geoUrl = f"http://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lon}&limit=5&appid={API_KEY}"
                geoResp = requests.get(geoUrl, timeout = 5)
                geoData = geoResp.json()
                    
                weather = {
                    'city': f"{data['name']}{f' - {geoData[0]['state']}' if geoData and geoData[0].get("state") else ''}, {data['sys']['country']}",
                    'temperature': data['main']['temp'],
                    'humidity': data['main']['humidity'],
                    'feelsLike': data['main']['feels_like'],
                    'tempMin': data['main']['temp_min'],
                    'tempMax': data['main']['temp_max'],
                    'pressure': data['main']['pressure'],
                    'visibility': data.get('visibility'),
                    'windSpeed': data['wind']['speed'],
                    'dt': data['dt'],
                    'sunrise': data['sys']['sunrise'],
                    'sunset': data['sys']['sunset'],
                    'timezone': data['timezone'],
                    'description': data['weather'][0]['description'].title(),
                    'icon': data['weather'][0]['icon'],
                }

                return JsonResponse({'weather': weather})
            else:
                return JsonResponse({'error': data.get("message", 'Could not fetch weather data')}, status = 404)
        except requests.RequestException:
            return JsonResponse({'error': "Network error."}, status = 500)

@csrf_exempt
def getCities(request):
    cities = []

    if request.method == "POST":
        cityName = request.POST.get("city", '').strip()
        if cityName:
            url = f"http://api.openweathermap.org/geo/1.0/direct?q={cityName}&limit=5&appid={API_KEY}"
        else:
            return JsonResponse({'error': "City name is empty."}, status = 400)
        try:
            resp = requests.get(url, timeout = 5)
            data = resp.json()

            if resp.status_code == 200:
                for item in data:
                    cities.append({
                        'name': item.get('name'),
                        'state': item.get('state'),
                        'country': item.get('country'),
                        'lat': item.get('lat'),
                        'lon': item.get('lon')
                    })

                return JsonResponse({'cities': cities})
            else:
                return JsonResponse({'error': data.get("message", "Could not fetch cities data")}, status = 404)
        except requests.RequestException:
            return JsonResponse({'error': "Network error."}, status = 500)