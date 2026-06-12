from __future__ import annotations

from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# Cargar variables de entorno desde .env
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.environ.get("DEBUG", "false").strip().lower() == "true"
ALLOWED_HOSTS: list[str] = ["*", "localhost", "127.0.0.1", "192.168.68.58"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",  # CORS headers para permitir requests desde frontend
    "companies",  # Nueva app para Company, User extendido, Onboarding
    # "accounts",  # DEPRECATED - Removido, ahora usamos companies.User
    "programs",
    "invitations",  # Sistema de invitaciones + onboarding con LinkedIn OAuth
]

# Custom User Model
AUTH_USER_MODEL = "companies.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # CORS debe ir antes de CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "mentorloop_clone.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "mentorloop_clone.wsgi.application"
ASGI_APPLICATION = "mentorloop_clone.asgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        # En local (DB remota de Render) conviene CONN_MAX_AGE=0 para no reutilizar
        # conexiones que Render cierra por inactividad. En prod se mantiene 600.
        conn_max_age=int(os.environ.get("CONN_MAX_AGE", "600")),
        conn_health_checks=True,
    )
}

# En producción (Render), DATABASE_URL se configura automáticamente desde render.yaml
# En desarrollo local, usa SQLite por defecto

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-es"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = DEBUG  # En desarrollo, permitir cualquier origen

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3005",
    "http://192.168.68.58:3000",
    "http://192.168.68.58:3001",
    "http://192.168.68.58:3005",
    "https://inspiratoria-frontend.onrender.com",
    "https://inspiratoria.aplifly.com",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ============ FRONTEND URL ============
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# ============ EMAIL CONFIGURATION ============
# SMTP real via Gmail (mismas credenciales que usa el frontend)
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "macarena@inspiratoria.org")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "qtuz adee xuos tbbe")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "Inspiratoria <macarena@inspiratoria.org>")

# Security Settings for Production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
