import json, urllib.request
data = json.loads(urllib.request.urlopen("http://localhost:8001/api/program-templates").read())
for t in data:
    if "SQMentors" in t.get("name",""):
        for m in t.get("modules", []):
            for r in m.get("resources", []):
                if "dataUrl" in r: r["dataUrl"] = "[b64]"
        print("KEYS:", list(t.keys()))
        print("modules count:", len(t.get("modules",[])))
        print("milestones:", json.dumps(t.get("milestones",[]), indent=2, ensure_ascii=False))
        print("tags:", t.get("tags"))
        print("mentor_reqs:", json.dumps(t.get("mentor_requirements",{}), indent=2))
        print("mentee_reqs:", json.dumps(t.get("mentee_requirements",{}), indent=2))
        print("duration:", t.get("duration"))
        print("category:", t.get("category"))
        print("req_cert:", t.get("requires_certification"))
        if t.get("modules"):
            m0 = t["modules"][0].copy()
            for r in m0.get("resources",[]):
                if "dataUrl" in r: r["dataUrl"] = "[b64]"
            print("module0:", json.dumps(m0, indent=2, ensure_ascii=False))
