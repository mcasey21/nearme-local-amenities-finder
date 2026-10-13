from django.contrib.gis.geos import Point, Polygon
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.gis.measure import D
from .models import City
from .serializers import CitySerializer, CityGeoJSONSerializer
from django.contrib.gis.db.models.functions import Distance

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



class NearestCitiesView(APIView):
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

        cities = City.objects.annotate(
            distance=Distance('location', point)
        ).order_by('distance')[:10]

        results = []

        for rank, city in enumerate(cities, start=1):
            results.append({
                'id': city.id,
                'name': city.name,
                'country': city.country,
                'population': city.population,
                'coordinates': {
                    'lat': city.location.y,
                    'lng': city.location.x,
                },
                'distance_km': round(
                    city.distance.km, 2
                ),
                'rank': rank,
            })

        return Response(results)


class ProximityRadiusView(APIView):
    def post(self, request):
        try:
            latitude = float(request.data['lat'])
            longitude = float(request.data['lng'])
            radius_km = float(request.data['radius_km'])
        except (KeyError, TypeError, ValueError):
            return Response(
                {'error': 'Numeric lat, lng and radius_km are required'},
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

        if not 0 < radius_km <= 20000:
            return Response(
                {'error': 'Radius must be greater than 0 and at most 20000 km'},
                status=400
            )

        point = Point(longitude, latitude, srid=4326)

        cities = City.objects.filter(
            location__distance_lte=(point, radius_km * 1000)
        ).annotate(
            distance=Distance('location', point)
        ).order_by('distance')

        results = []

        for city in cities:
            results.append({
                'id': city.id,
                'name': city.name,
                'country': city.country,
                'population': city.population,
                'coordinates': {
                    'lat': city.location.y,
                    'lng': city.location.x,
                },
                'distance_km': round(city.distance.km, 2),
            })

        return Response(results)
