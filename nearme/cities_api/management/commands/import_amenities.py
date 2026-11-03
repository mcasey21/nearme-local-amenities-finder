import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point

from cities_api.models import Amenity


class Command(BaseCommand):
    help = "Import Dundalk amenities from JSON"

    def handle(self, *args, **options):
        json_path = Path("dundalk_amenities_import.json")

        with json_path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        created = 0

        for item in data:
            Amenity.objects.create(
                name=item["name"],
                category=item["category"],
                description=item.get("description", ""),
                address=item.get("address", ""),
                rating=item.get("rating"),
                location=Point(
                    item["longitude"],
                    item["latitude"],
                    srid=4326
                )
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully imported {created} amenities."
            )
        )