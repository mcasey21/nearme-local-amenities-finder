from django.contrib.gis.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Amenity(models.Model):

    CATEGORY_CHOICES = [
        ('cafe', 'Café'),
        ('restaurant', 'Restaurant'),
        ('supermarket', 'Supermarket'),
        ('park', 'Park'),
        ('pharmacy', 'Pharmacy'),
        ('transport', 'Public Transport'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        db_index=True
    )
    description = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    rating = models.FloatField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(5)
        ]
    )
    location = models.PointField(
        geography=True,
        srid=4326,
        spatial_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    @property
    def latitude(self):
        return self.location.y if self.location else None

    @property
    def longitude(self):
        return self.location.x if self.location else None