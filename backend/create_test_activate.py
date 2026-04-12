import os, django, secrets
os.environ['DJANGO_SETTINGS_MODULE'] = 'mentorloop_clone.settings'
django.setup()
from companies.models import User
from django.utils import timezone
from datetime import timedelta

email = 'test-activate@test.com'
User.objects.filter(email=email).delete()

token = secrets.token_urlsafe(48)
u = User(
    username='test_activate',
    email=email,
    full_name='Test Activation User',
    role='admin',
    is_active=True,
    is_account_activated=False,
    otp_code='1234',
    otp_expires_at=timezone.now() + timedelta(hours=24),
    activation_token=token,
)
u.set_unusable_password()
u.save()
print(f'Creado: {u.email}')
print(f'Token: {token}')
print(f'OTP: 1234')
print(f'URL: http://localhost:3000/activate/{token}')
