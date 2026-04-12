import urllib.request, json

API = 'http://localhost:8001'
data = json.loads(urllib.request.urlopen(f'{API}/api/program-templates').read())
for t in data:
    for m in t.get('modules', []):
        for r in m.get('resources', []):
            if r.get('file_data'): r['file_data'] = '[BASE64]'
    # Print key fields only
    print(f"name: {t.get('name')}")
    print(f"program_id: {t.get('program_id')}")
    print(f"id: {t.get('id')}")
    print(f"duration: {t.get('duration')}")
    print(f"category: {t.get('category')}")
    print(f"tags: {t.get('tags')}")
    print(f"certification: {t.get('certification_required')}")
    print(f"mentor_reqs: {t.get('mentorRequirements')}")
    print(f"mentee_reqs: {t.get('menteeRequirements')}")
    print(f"modules ({len(t.get('modules',[]))}):")
    for m in t.get('modules', []):
        sess = m.get('sessions', [])
        res = m.get('resources', [])
        print(f"  {m.get('order')}. {m.get('title')} | {m.get('duration_hours')}h | sessions:{len(sess) if isinstance(sess,list) else sess} | resources:{len(res)}")
        for s in (sess if isinstance(sess, list) else []):
            print(f"     session: {s.get('title')} ({s.get('duration_minutes')}min)")
        for r in res:
            print(f"     resource: {r.get('title')} ({r.get('type')})")
    print(f"milestones ({len(t.get('milestones',[]))}):")
    for ms in t.get('milestones', []):
        print(f"  Week {ms.get('week')}: {ms.get('title')} - deliverable:{ms.get('deliverable')}")
