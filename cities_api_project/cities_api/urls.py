from django.urls import path

from .views import (
    CityListView,
    CityDetailView,
    CityGeoJSONView,
    CityRadiusView,
    CityBoundingBoxView,
)

urlpatterns = [
    path('cities/', CityListView.as_view(), name='city-list'),
    path('cities/<int:pk>/', CityDetailView.as_view(), name='city-detail'),
    path('cities/geojson/', CityGeoJSONView.as_view(), name='city-geojson'),
    path('cities/radius/', CityRadiusView.as_view(), name='city-radius'),
    path('cities/bbox/', CityBoundingBoxView.as_view(), name='city-bbox'),
]
