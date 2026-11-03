from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('cities_api.urls')),

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),

    path(
        'map/',
        TemplateView.as_view(template_name='map.html'),
        name='map',
    ),

    path(
        '',
        TemplateView.as_view(template_name='map.html'),
        name='map_home',
    ),

    path(
    'accounts/login/',
    auth_views.LoginView.as_view(template_name='login.html'),
    name='login',
    ),
    
    path(
        'accounts/logout/',
        auth_views.LogoutView.as_view(),
        name='logout',
    ),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT,
    )
