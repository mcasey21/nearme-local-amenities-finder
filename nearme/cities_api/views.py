from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.db.models.functions import Distance
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Amenity
from .serializers import (
    AmenitySerializer,
    AmenityGeoJSONSerializer,
)

class AmenityListView(generics.ListAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = ['category']
    search_fields = ['name', 'description', 'address']
    ordering_fields = ['name', 'rating', 'category']
    ordering = ['name']


class AmenityDetailView(generics.RetrieveAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer


class AmenityGeoJSONView(generics.ListAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenityGeoJSONSerializer


class AmenityRadiusView(APIView):
    def get(self, request):
        try:
            longitude = float(request.query_params['longitude'])
            latitude = float(request.query_params['latitude'])
            radius = float(request.query_params['radius'])
        except (KeyError, ValueError):
            return Response(
                {
                    'error': (
                        'longitude, latitude and radius are required'
                    )
                },
                status=400
            )

        if not -180 <= longitude <= 180:
            return Response(
                {'error': 'Longitude must be between -180 and 180'},
                status=400
            )

        if not -90 <= latitude <= 90:
            return Response(
                {'error': 'Latitude must be between -90 and 90'},
                status=400
            )

        if not 0 < radius <= 20000:
            return Response(
                {'error': 'Radius must be greater than 0 and at most 20000 km'},
                status=400
            )

        point = Point(longitude, latitude, srid=4326)

        amenities = Amenity.objects.filter(
            location__distance_lte=(point, radius * 1000)
        ).annotate(
            distance=Distance('location', point)
        ).order_by('distance')

        serializer = AmenitySerializer(amenities, many=True)

        return Response(serializer.data)


class AmenityBoundingBoxView(APIView):
    def get(self, request):
        try:
            min_longitude = float(request.query_params['min_longitude'])
            min_latitude = float(request.query_params['min_latitude'])
            max_longitude = float(request.query_params['max_longitude'])
            max_latitude = float(request.query_params['max_latitude'])
        except (KeyError, ValueError):
            return Response(
                {
                    'error': (
                        'min_longitude, min_latitude, '
                        'max_longitude and max_latitude are required'
                    )
                },
                status=400
            )

        if not (
            -180 <= min_longitude <= 180
            and -180 <= max_longitude <= 180
            and -90 <= min_latitude <= 90
            and -90 <= max_latitude <= 90
        ):
            return Response(
                {'error': 'Bounding box coordinates are out of range'},
                status=400
            )

        if min_longitude >= max_longitude or min_latitude >= max_latitude:
            return Response(
                {'error': 'Minimum coordinates must be less than maximum coordinates'},
                status=400
            )

        bbox = Polygon.from_bbox((
            min_longitude,
            min_latitude,
            max_longitude,
            max_latitude,
        ))

        amenities = Amenity.objects.filter(
            location__within=bbox
        )

        serializer = AmenitySerializer(amenities, many=True)

        return Response(serializer.data)


class NearestAmenitiesView(APIView):
    def post(self, request):
        try:
            latitude = float(request.data['lat'])
            longitude = float(request.data['lng'])
        except (KeyError, TypeError, ValueError):
            return Response(
                {'error': 'Numeric lat and lng are required'},
                status=400
            )

        if not -90 <= latitude <= 90:
            return Response(
                {'error': 'Latitude must be between -90 and 90'},
                status=400
            )

        if not -180 <= longitude <= 180:
            return Response(
                {'error': 'Longitude must be between -180 and 180'},
                status=400
            )

        point = Point(longitude, latitude, srid=4326)

        amenities = Amenity.objects.annotate(
            distance=Distance('location', point)
        ).order_by('distance')[:10]

        results = []

        for rank, amenity in enumerate(amenities, start=1):
            results.append({
                'id': amenity.id,
                'name': amenity.name,
                'category': amenity.category,
                'address': amenity.address,
                'coordinates': {
                    'lat': amenity.location.y,
                    'lng': amenity.location.x,
                },
                'distance_km': round(amenity.distance.km, 2),
                'rank': rank,
            })

        return Response(results)


class AmenityCreateView(generics.CreateAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [IsAdminUser]


class AmenityUpdateView(generics.UpdateAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [IsAdminUser]


class AmenityDeleteView(generics.DestroyAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [IsAdminUser]
