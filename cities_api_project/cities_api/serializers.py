from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import City


class CitySerializer(serializers.ModelSerializer):
    """
    Standard JSON serializer for City objects.
    """

    latitude = serializers.FloatField(read_only=True)
    longitude = serializers.FloatField(read_only=True)
    coordinates = serializers.SerializerMethodField()
    population_category = serializers.CharField(read_only=True)
    age_years = serializers.IntegerField(read_only=True)

    class Meta:
        model = City
        fields = [
            'id',
            'name',
            'country',
            'region',
            'population',
            'location',
            'latitude',
            'longitude',
            'coordinates',
            'elevation_m',
            'founded_year',
            'is_capital',
            'timezone',
            'population_category',
            'age_years',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]

    def get_coordinates(self, obj):
        return obj.coordinates


class CityGeoJSONSerializer(GeoFeatureModelSerializer):
    """
    GeoJSON serializer for City objects.
    """

    population_category = serializers.CharField(read_only=True)
    age_years = serializers.IntegerField(read_only=True)

    class Meta:
        model = City
        geo_field = 'location'
        fields = [
            'id',
            'name',
            'country',
            'region',
            'population',
            'elevation_m',
            'founded_year',
            'is_capital',
            'timezone',
            'population_category',
            'age_years',
        ]
