from django.urls import path

from .views import (
    CityListView,
    CityDetailView,
    CityGeoJSONView,
    CityRadiusView,
    CityBoundingBoxView,
    NearestCitiesView,
    ProximityRadiusView,
)

urlpatterns = [
    path('cities/', CityListView.as_view(), name='city-list'),
    path('cities/<int:pk>/', CityDetailView.as_view(), name='city-detail'),
    path('cities/geojson/', CityGeoJSONView.as_view(), name='city-geojson'),
    path('cities/radius/', ProximityRadiusView.as_view(), name='city-proximity-radius'),
    path('cities/bbox/', CityBoundingBoxView.as_view(), name='city-bbox'),
    path('cities/nearest/',NearestCitiesView.as_view(), name='city-nearest'),
    path('cities/radius/', ProximityRadiusView.as_view(), name='city-proximity-radius')
]

