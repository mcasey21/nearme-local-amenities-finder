
from django.urls import path

from .views import (
    AmenityListView,
    AmenityDetailView,
    AmenityGeoJSONView,
    AmenityRadiusView,
    AmenityBoundingBoxView,
    NearestAmenitiesView,
    AmenityCreateView,
    AmenityUpdateView,
    AmenityDeleteView,
)

urlpatterns = [
    path('amenities/', AmenityListView.as_view(), name='amenity-list'),
    path('amenities/<int:pk>/', AmenityDetailView.as_view(), name='amenity-detail'),
    path('amenities/geojson/', AmenityGeoJSONView.as_view(), name='amenity-geojson'),
    path('amenities/radius/', AmenityRadiusView.as_view(), name='amenity-radius'),
    path('amenities/bbox/', AmenityBoundingBoxView.as_view(), name='amenity-bbox'),
    path('amenities/nearest/', NearestAmenitiesView.as_view(), name='amenity-nearest'),

    # Admin CRUD endpoints
    path('amenities/create/', AmenityCreateView.as_view(), name='amenity-create'),
    path('amenities/<int:pk>/update/', AmenityUpdateView.as_view(), name='amenity-update'),
    path('amenities/<int:pk>/delete/', AmenityDeleteView.as_view(), name='amenity-delete'),
]
