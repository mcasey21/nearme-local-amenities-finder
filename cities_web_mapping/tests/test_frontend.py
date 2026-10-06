from pathlib import Path

from django.conf import settings
from django.test import TestCase, Client


class MapViewTests(TestCase):

    def setUp(self):
        self.client = Client()

    def test_map_view_loads(self):
        """Test that the map page loads successfully"""
        response = self.client.get('/map/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('Leaflet', response.content.decode())

    def test_static_files_exist(self):
        """Test that required static files exist"""
        map_js = Path(settings.BASE_DIR) / 'static' / 'js' / 'map.js'
        styles_css = Path(settings.BASE_DIR) / 'static' / 'css' / 'styles.css'

        self.assertTrue(map_js.exists())
        self.assertTrue(styles_css.exists())
