from django.urls import path
from . import views

urlpatterns = [
    path('', views.getWeather),
    path('search-cities/', views.getCities, name='search-cities')
]