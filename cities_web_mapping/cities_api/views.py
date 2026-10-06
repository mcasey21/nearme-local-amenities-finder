from django.contrib.gis.geos import Point, Polygon
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import City
from .serializers import CitySerializer, CityGeoJSONSerializer


class CityListView(generics.ListAPIView):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ['country', 'region', 'is_capital']
    search_fields = ['name', 'country', 'region']
    ordering_fields = ['name', 'population', 'country', 'founded_year']
    ordering = ['-population']


class CityDetailView(generics.RetrieveAPIView):
    queryset = City.objects.all()
    serializer_class = CitySerializer


class CityGeoJSONView(generics.ListAPIView):
    queryset = City.objects.all()
    serializer_class = CityGeoJSONSerializer


class CityRadiusView(APIView):
    def get(self, request):
        try:
            longitude = float(request.query_params['longitude'])
            latitude = float(request.query_params['latitude'])
            radius = float(request.query_params['radius'])
        except (KeyError, ValueError):
            return Response(
                {'error': 'longitude, latitude and radius are required'},
                status=400
            )

        point = Point(longitude, latitude, srid=4326)

        cities = City.objects.filter(
            location__distance_lte=(point, radius * 1000)
        )

        serializer = CitySerializer(cities, many=True)

        return Response(serializer.data)


class CityBoundingBoxView(APIView):
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

        bbox = Polygon.from_bbox((
            min_longitude,
            min_latitude,
            max_longitude,
            max_latitude,
        ))

        cities = City.objects.filter(
            location__within=bbox
        )

        serializer = CitySerializer(cities, many=True)

        return Response(serializer.data)
