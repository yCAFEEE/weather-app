from django.db import models

class WeatherInfo(models.Model):
    cityName = models.CharField(max_length = 300)
    temperature = models.FloatField(null = True, blank = True)
    humidity = models.IntegerField(null = True, blank = True)
    feelsLike = models.FloatField(null = True, blank = True)
    tempMin = models.FloatField(null = True, blank = True)
    tempMax = models.FloatField(null = True, blank = True)
    pressure = models.IntegerField(null = True, blank = True)
    visibility = models.IntegerField(null = True, blank = True)
    windSpeed = models.IntegerField(null = True, blank = True)
    dt = models.IntegerField(null = True, blank = True)
    sunrise = models.IntegerField(null = True, blank = True)
    sunset = models.IntegerField(null = True, blank = True)
    timezone = models.IntegerField(null = True, blank = True)
    description = models.CharField(max_length = 300, null = True, blank = True)

    def __str__(self):
        return self.cityName