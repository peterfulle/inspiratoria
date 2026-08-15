import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'mentorloop_clone.settings'
django.setup()
from companies.models import User

u = User.objects.filter(email='prfulle@gmail.com').first()
if u:
    print(f'User: {u.email}, portal_code: {u.portal_code}, active: {u.is_active}')
    for pwd in ['admin123', 'Admin123!', 'password', '12345678', 'test1234']:
        if u.check_password(pwd):
            print(f'  PASSWORD MATCH: {pwd}')
            break
    else:
        print('  No common password matched')
else:
    print('User not found, listing:')
    for u2 in User.objects.all()[:10]:
        print(f'  {u2.email} / portal={u2.portal_code}')
