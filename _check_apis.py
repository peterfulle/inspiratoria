import urllib.request, json

PID = 'dbd9939c-4e22-4638-8c29-51dd4b510453'
API = 'http://localhost:8001'

# 1. Program template
data = json.loads(urllib.request.urlopen(f'{API}/api/program-templates').read())
tmpl = None
for t in data:
    if t.get('program_id') == PID:
        tmpl = t
        break

if tmpl:
    # strip base64
    for m in tmpl.get('modules', []):
        for r in m.get('resources', []):
            if r.get('file_data'): r['file_data'] = '[BASE64]'
    print("=== TEMPLATE KEYS ===")
    print(list(tmpl.keys()))
    print(f"\nModules: {len(tmpl.get('modules', []))}")
    for m in tmpl.get('modules', []):
        print(f"  - {m.get('order', '?')}. {m.get('title')} | {m.get('duration_hours')}h | sessions:{len(m.get('sessions',[]))} resources:{len(m.get('resources',[]))}")
    print(f"\nMilestones: {len(tmpl.get('milestones', []))}")
    for ms in tmpl.get('milestones', []):
        print(f"  - Week {ms.get('week')}: {ms.get('title')} - {ms.get('description')}")
    print(f"\nTags: {tmpl.get('tags', [])}")
    print(f"Duration: {tmpl.get('duration')}")
    print(f"Category: {tmpl.get('category')}")
    print(f"Certification: {tmpl.get('certification_required')}")
    print(f"Mentor reqs: {tmpl.get('mentor_requirements')}")
    print(f"Mentee reqs: {tmpl.get('mentee_requirements')}")
else:
    print("Template not found")

# 2. Participants
pdata = json.loads(urllib.request.urlopen(f'{API}/api/programs/{PID}/participants').read())
print(f"\n=== PARTICIPANTS ({len(pdata)}) ===")
for p in pdata:
    print(f"  - {p.get('user_name','?')} | {p.get('user_email','?')} | role:{p.get('role','?')} | status:{p.get('status','?')}")

# 3. My-programs for user prfulle
UID = '64f536ff-c8b0-440f-b395-fc5ffc596a1c'
mp = json.loads(urllib.request.urlopen(f'{API}/api/programs/my-programs/{UID}').read())
print(f"\n=== MY-PROGRAMS ({len(mp)}) ===")
for p in mp:
    print(f"  keys: {list(p.keys())}")
    print(f"  modules: {len(p.get('modules',[]))}, activities: {len(p.get('activities',[]))}")
    print(f"  vinculation: {p.get('vinculation')}")
