from django.contrib.gis.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.gis.geos import Point


class CityManager(models.Manager):
    def capitals(self):
        return self.filter(is_capital=True)

    def by_country(self, country):
        return self.filter(country__iexact=country)

    def large_cities(self, min_population=500000):
        return self.filter(population__gte=min_population)

    def within_radius(self, longitude, latitude, radius_km):
        point = Point(longitude, latitude, srid=4326)
        return self.filter(
            location__distance_lte=(point, radius_km * 1000)
        )

    def in_bounding_box(
        self,
        min_longitude,
        min_latitude,
        max_longitude,
        max_latitude
    ):
        return self.filter(
            location__within=(
                Point(min_longitude, min_latitude, srid=4326),
                Point(max_longitude, max_latitude, srid=4326)
            )
        )


class City(models.Model):
    name = models.CharField(max_length=100, db_index=True)
    country = models.CharField(max_length=100, db_index=True)
    region = models.CharField(max_length=100, blank=True)
    population = models.IntegerField(validators=[MinValueValidator(0)])
    location = models.PointField(geography=True, srid=4326)
    elevation_m = models.FloatField(null=True, blank=True)
    founded_year = models.IntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(2026)
        ]
    )
    is_capital = models.BooleanField(default=False, db_index=True)
    timezone = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CityManager()

    class Meta:
        ordering = ['-population', 'name']
        indexes = [
            models.Index(fields=['country', '-population']),
            models.Index(fields=['is_capital']),
            models.Index(fields=['population']),
        ]

    def __str__(self):
        return f"{self.name}, {self.country}"

    @property
    def latitude(self):
        return self.location.y if self.location else None

    @property
    def longitude(self):
        return self.location.x if self.location else None

    @property
    def coordinates(self):
        if self.location:
            return {
                'latitude': self.latitude,
                'longitude': self.longitude
            }
        return None

    @property
    def population_category(self):
        if self.population >= 1000000:
            return 'Mega City'
        elif self.population >= 500000:
            return 'Large City'
        elif self.population >= 100000:
            return 'Medium City'
        else:
            return 'Small City'

    @property
    def age_years(self):
        if self.founded_year:
            return 2026 - self.founded_year
        return None
