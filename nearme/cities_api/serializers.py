from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import Amenity


class AmenitySerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(read_only=True)
    longitude = serializers.FloatField(read_only=True)

    class Meta:
        model = Amenity
        fields = [
            'id',
            'name',
            'category',
            'description',
            'address',
            'rating',
            'location',
            'latitude',
            'longitude',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]


class AmenityGeoJSONSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Amenity
        geo_field = 'location'
        fields = [
            'id',
            'name',
            'category',
            'description',
            'address',
            'rating',
        ]