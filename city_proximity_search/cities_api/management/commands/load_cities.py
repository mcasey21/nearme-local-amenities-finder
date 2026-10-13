from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point

from cities_api.models import City


CITIES_DATA = [
    {
        "name": "Dublin",
        "country": "Ireland",
        "region": "Leinster",
        "population": 1173170,
        "latitude": 53.3498,
        "longitude": -6.2603,
        "elevation_m": 20,
        "founded_year": 841,
        "is_capital": True,
        "timezone": "Europe/Dublin",
    },
    {
        "name": "London",
        "country": "United Kingdom",
        "region": "England",
        "population": 8982000,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "elevation_m": 11,
        "founded_year": 43,
        "is_capital": True,
        "timezone": "Europe/London",
    },
    {
        "name": "Paris",
        "country": "France",
        "region": "Île-de-France",
        "population": 2161000,
        "latitude": 48.8566,
        "longitude": 2.3522,
        "elevation_m": 35,
        "founded_year": 52,
        "is_capital": True,
        "timezone": "Europe/Paris",
    },
    {
        "name": "Berlin",
        "country": "Germany",
        "region": "Berlin",
        "population": 3645000,
        "latitude": 52.5200,
        "longitude": 13.4050,
        "elevation_m": 34,
        "founded_year": 1237,
        "is_capital": True,
        "timezone": "Europe/Berlin",
    },
    {
        "name": "Madrid",
        "country": "Spain",
        "region": "Community of Madrid",
        "population": 3223000,
        "latitude": 40.4168,
        "longitude": -3.7038,
        "elevation_m": 667,
        "founded_year": 860,
        "is_capital": True,
        "timezone": "Europe/Madrid",
    },
    {
        "name": "Rome",
        "country": "Italy",
        "region": "Lazio",
        "population": 2873000,
        "latitude": 41.9028,
        "longitude": 12.4964,
        "elevation_m": 21,
        "founded_year": -753,
        "is_capital": True,
        "timezone": "Europe/Rome",
    },
    {
        "name": "Amsterdam",
        "country": "Netherlands",
        "region": "North Holland",
        "population": 921000,
        "latitude": 52.3676,
        "longitude": 4.9041,
        "elevation_m": -2,
        "founded_year": 1275,
        "is_capital": True,
        "timezone": "Europe/Amsterdam",
    },
    {
        "name": "Barcelona",
        "country": "Spain",
        "region": "Catalonia",
        "population": 1636000,
        "latitude": 41.3851,
        "longitude": 2.1734,
        "elevation_m": 12,
        "founded_year": -15,
        "is_capital": False,
        "timezone": "Europe/Madrid",
    },
    {
        "name": "Munich",
        "country": "Germany",
        "region": "Bavaria",
        "population": 1488000,
        "latitude": 48.1351,
        "longitude": 11.5820,
        "elevation_m": 519,
        "founded_year": 1158,
        "is_capital": False,
        "timezone": "Europe/Berlin",
    },
    {
        "name": "Vienna",
        "country": "Austria",
        "region": "Vienna",
        "population": 2000000,
        "latitude": 48.2082,
        "longitude": 16.3738,
        "elevation_m": 171,
        "founded_year": 500,
        "is_capital": True,
        "timezone": "Europe/Vienna",
    },
    {
        "name": "Stockholm",
        "country": "Sweden",
        "region": "Stockholm County",
        "population": 975000,
        "latitude": 59.3293,
        "longitude": 18.0686,
        "elevation_m": 28,
        "founded_year": 1252,
        "is_capital": True,
        "timezone": "Europe/Stockholm",
    },
    {
        "name": "Copenhagen",
        "country": "Denmark",
        "region": "Capital Region",
        "population": 644000,
        "latitude": 55.6761,
        "longitude": 12.5683,
        "elevation_m": 14,
        "founded_year": 1167,
        "is_capital": True,
        "timezone": "Europe/Copenhagen",
    },
    {
        "name": "Oslo",
        "country": "Norway",
        "region": "Oslo",
        "population": 709000,
        "latitude": 59.9139,
        "longitude": 10.7522,
        "elevation_m": 23,
        "founded_year": 1040,
        "is_capital": True,
        "timezone": "Europe/Oslo",
    },
    {
        "name": "Helsinki",
        "country": "Finland",
        "region": "Uusimaa",
        "population": 656000,
        "latitude": 60.1699,
        "longitude": 24.9384,
        "elevation_m": 26,
        "founded_year": 1550,
        "is_capital": True,
        "timezone": "Europe/Helsinki",
    },
    {
        "name": "Warsaw",
        "country": "Poland",
        "region": "Masovian",
        "population": 1863000,
        "latitude": 52.2297,
        "longitude": 21.0122,
        "elevation_m": 100,
        "founded_year": 1300,
        "is_capital": True,
        "timezone": "Europe/Warsaw",
    },
    {
        "name": "Prague",
        "country": "Czech Republic",
        "region": "Prague",
        "population": 1309000,
        "latitude": 50.0755,
        "longitude": 14.4378,
        "elevation_m": 235,
        "founded_year": 885,
        "is_capital": True,
        "timezone": "Europe/Prague",
    },
    {
        "name": "Brussels",
        "country": "Belgium",
        "region": "Brussels-Capital",
        "population": 185000,
        "latitude": 50.8503,
        "longitude": 4.3517,
        "elevation_m": 13,
        "founded_year": 979,
        "is_capital": True,
        "timezone": "Europe/Brussels",
    },
    {
        "name": "Zurich",
        "country": "Switzerland",
        "region": "Zurich",
        "population": 443000,
        "latitude": 47.3769,
        "longitude": 8.5417,
        "elevation_m": 408,
        "founded_year": 15,
        "is_capital": False,
        "timezone": "Europe/Zurich",
    },
    {
        "name": "Lisbon",
        "country": "Portugal",
        "region": "Lisbon",
        "population": 545000,
        "latitude": 38.7223,
        "longitude": -9.1393,
        "elevation_m": 2,
        "founded_year": -1200,
        "is_capital": True,
        "timezone": "Europe/Lisbon",
    },
    {
        "name": "Athens",
        "country": "Greece",
        "region": "Attica",
        "population": 664000,
        "latitude": 37.9838,
        "longitude": 23.7275,
        "elevation_m": 70,
        "founded_year": -3000,
        "is_capital": True,
        "timezone": "Europe/Athens",
    },
]


class Command(BaseCommand):
    help = "Load European city data into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing city data before loading",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = City.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(
                    f"Deleted {deleted} existing records."
                )
            )

        created_count = 0
        updated_count = 0

        for city_data in CITIES_DATA:
            location = Point(
                city_data.pop("longitude"),
                city_data.pop("latitude"),
                srid=4326,
            )

            city, created = City.objects.update_or_create(
                name=city_data["name"],
                country=city_data["country"],
                defaults={
                    **city_data,
                    "location": location,
                },
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created: {city.name}"
                    )
                )
            else:
                updated_count += 1
                self.stdout.write(
                    f"Updated: {city.name}"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nCreated: {created_count}, "
                f"Updated: {updated_count}, "
                f"Total: {City.objects.count()}"
            )
        )
