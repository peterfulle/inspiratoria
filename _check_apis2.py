import urllib.request, json

API = 'http://localhost:8001'
PID = 'dbd9939c-4e22-4638-8c29-51dd4b510453'

data = json.loads(urllib.request.urlopen(f'{API}/api/program-templates').read())
print(f"Total templates: {len(data)}")
for t in data:
    print(f"  id={t.get('id')} program_id={t.get('program_id')} modules={len(t.get('modules',[]))} milestones={len(t.get('milestones',[]))}")

# Also check participants detail
pdata = json.loads(urllib.request.urlopen(f'{API}/api/programs/{PID}/participants').read())
print(f"\nParticipants raw:")
for p in pdata:
    print(f"  {json.dumps(p, ensure_ascii=False)[:300]}")
