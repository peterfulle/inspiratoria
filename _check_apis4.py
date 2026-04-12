import urllib.request, json

API = 'http://localhost:8001'
data = json.loads(urllib.request.urlopen(f'{API}/api/program-templates').read())
for t in data:
    if t.get('name') == 'SQMentors 2026 | Mentores':
        for i, m in enumerate(t.get('modules', [])):
            for r in m.get('resources', []):
                if r.get('file_data'): r['file_data'] = '[BASE64]'
            print(f"Module {i}: {json.dumps(m, indent=2, ensure_ascii=False)}\n")
        for i, ms in enumerate(t.get('milestones', [])):
            print(f"Milestone {i}: {json.dumps(ms, indent=2, ensure_ascii=False)}\n")
