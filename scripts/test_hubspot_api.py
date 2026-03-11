#!/usr/bin/env python3
import urllib.request, json, sys

API_KEY = "7a40dae8-66fb-4b07-a5c4-4cb1085af348"

# 1. Test contacts API
print("1. Probando API contactos...")
try:
    url = f"https://api.hubapi.com/crm/v3/objects/contacts?hapikey={API_KEY}&limit=1"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        results = data.get("results", [])
        print(f"   OK - {len(results)} contactos")
except Exception as e:
    print(f"   ERROR - {e}")

# 2. List existing forms
print("2. Listando forms existentes...")
try:
    url = f"https://api.hubapi.com/forms/v2/forms?hapikey={API_KEY}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        forms = json.loads(resp.read())
        print(f"   OK - {len(forms)} forms encontrados")
        for f in forms[:5]:
            name = f.get("name", "?")
            guid = f.get("guid", "?")
            pid = f.get("portalId", "?")
            print(f"   - {name} | guid={guid} | portalId={pid}")
except urllib.error.HTTPError as e:
    body = e.read().decode()[:200]
    print(f"   ERROR {e.code} - {body}")

# 3. Get contact properties
print("3. Propiedades de contacto...")
try:
    url = f"https://api.hubapi.com/crm/v3/properties/contacts?hapikey={API_KEY}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        props = json.loads(resp.read())
        results = props.get("results", [])
        print(f"   OK - {len(results)} propiedades")
except urllib.error.HTTPError as e:
    body = e.read().decode()[:200]
    print(f"   ERROR {e.code} - {body}")
