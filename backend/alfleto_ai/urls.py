from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # Las rutas de API se manejan a través de ASGI (FastAPI)
]
