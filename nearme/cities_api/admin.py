from django.contrib import admin
from .models import Amenity


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'address',
        'rating',
    )

    list_filter = ('category',)

    search_fields = (
        'name',
        'address',
        'description',
    )