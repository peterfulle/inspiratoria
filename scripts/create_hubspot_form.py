#!/usr/bin/env python3
"""
Creates an Inspiratoria Studio form in HubSpot via API.
Usage: python3 create_hubspot_form.py
"""
import json
import urllib.request
import urllib.error

API_KEY = "7a40dae8-66fb-4b07-a5c4-4cb1085af348"

# Step 1: Get portal ID - try both auth methods
print("🔍 Obteniendo Portal ID...")
portal_id = None

# Method 1: Bearer token (Private App token)
for method_name, url, headers in [
    ("Bearer", "https://api.hubapi.com/account-info/v3/details", {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}),
    ("hapikey", f"https://api.hubapi.com/account-info/v3/details?hapikey={API_KEY}", {"Content-Type": "application/json"}),
    ("Bearer-v1", "https://api.hubapi.com/integrations/v1/me", {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}),
    ("hapikey-v1", f"https://api.hubapi.com/integrations/v1/me?hapikey={API_KEY}", {"Content-Type": "application/json"}),
]:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            info = json.loads(resp.read())
            portal_id = info.get("portalId")
            print(f"✅ Portal ID ({method_name}): {portal_id}")
            break
    except urllib.error.HTTPError as e:
        print(f"   {method_name}: {e.code} - {e.reason}")
        e.read()  # consume body

if not portal_id:
    print("\n⚠️  No se pudo obtener el Portal ID automáticamente.")
    print("Intentando crear el form de todas formas...\n")

# Step 2: Create the form
print("\n📝 Creando formulario 'Inspiratoria Studio - Account Studio'...")

form_payload = {
    "name": "Interfaz Inspiratoria - Account Studio",
    "formType": "HUBSPOT",
    "configuration": {
        "language": "es",
        "createNewContactForNewEmail": True,
        "prePopulateKnownValues": True,
        "allowLinkToResetKnownValues": True,
        "lifecycleStage": "lead",
    },
    "displayOptions": {
        "renderRawHtml": False,
        "cssClass": "",
        "submitButtonText": "Solicitar Contacto",
        "style": {
            "fontFamily": "arial, helvetica, sans-serif",
            "backgroundWidth": "100%",
            "labelTextColor": "#33475b",
            "labelTextSize": "13px",
        },
        "thankYouMessageJson": "<p>¡Gracias! Un ejecutivo PM de Inspiratoria te contactará pronto.</p>",
    },
    "fieldGroups": [
        {
            "groupType": "default_group",
            "richTextType": "TEXT",
            "fields": [
                {
                    "name": "firstname",
                    "label": "Nombre",
                    "fieldType": "text",
                    "objectTypeId": "0-1",
                    "required": True,
                }
            ],
        },
        {
            "groupType": "default_group",
            "richTextType": "TEXT",
            "fields": [
                {
                    "name": "lastname",
                    "label": "Apellido",
                    "fieldType": "text",
                    "objectTypeId": "0-1",
                    "required": True,
                }
            ],
        },
        {
            "groupType": "default_group",
            "richTextType": "TEXT",
            "fields": [
                {
                    "name": "email",
                    "label": "Email Corporativo",
                    "fieldType": "email",
                    "objectTypeId": "0-1",
                    "required": True,
                }
            ],
        },
        {
            "groupType": "default_group",
            "richTextType": "TEXT",
            "fields": [
                {
                    "name": "phone",
                    "label": "Teléfono",
                    "fieldType": "phone",
                    "objectTypeId": "0-1",
                    "required": True,
                }
            ],
        },
        {
            "groupType": "default_group",
            "richTextType": "TEXT",
            "fields": [
                {
                    "name": "company",
                    "label": "Empresa",
                    "fieldType": "text",
                    "objectTypeId": "0-1",
                    "required": True,
                }
            ],
        },
        {
            "groupType": "default_group",
            "richTextType": "TEXT",
            "fields": [
                {
                    "name": "industry",
                    "label": "Industria",
                    "fieldType": "select",
                    "objectTypeId": "0-1",
                    "required": True,
                    "options": [
                        {"label": "Tecnología", "value": "technology"},
                        {"label": "Finanzas y Banca", "value": "finance"},
                        {"label": "Retail y Comercio", "value": "retail"},
                        {"label": "Salud", "value": "healthcare"},
                        {"label": "Manufactura", "value": "manufacturing"},
                        {"label": "Minería", "value": "mining"},
                        {"label": "Energía", "value": "energy"},
                        {"label": "Educación", "value": "education"},
                        {"label": "Consultoría", "value": "consulting"},
                        {"label": "Otro", "value": "other"},
                    ],
                }
            ],
        },
        {
            "groupType": "default_group",
            "richTextType": "TEXT",
            "fields": [
                {
                    "name": "numemployees",
                    "label": "Tamaño de Empresa",
                    "fieldType": "select",
                    "objectTypeId": "0-1",
                    "required": True,
                    "options": [
                        {"label": "1-50 empleados", "value": "1-50"},
                        {"label": "51-200 empleados", "value": "51-200"},
                        {"label": "201-500 empleados", "value": "201-500"},
                        {"label": "500+ empleados", "value": "500+"},
                    ],
                }
            ],
        },
        {
            "groupType": "default_group",
            "richTextType": "TEXT",
            "fields": [
                {
                    "name": "message",
                    "label": "Mensaje (opcional)",
                    "fieldType": "textarea",
                    "objectTypeId": "0-1",
                    "required": False,
                }
            ],
        },
    ],
    "legalConsentOptions": {
        "type": "NONE",
    },
}

data = json.dumps(form_payload).encode("utf-8")

# Try both auth methods for form creation
form_created = False
for method_name, url, headers in [
    ("Bearer", "https://api.hubapi.com/marketing/v3/forms/", {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}),
    ("hapikey", f"https://api.hubapi.com/marketing/v3/forms/?hapikey={API_KEY}", {"Content-Type": "application/json"}),
    ("Bearer-v2", "https://api.hubapi.com/forms/v2/forms", {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}),
    ("hapikey-v2", f"https://api.hubapi.com/forms/v2/forms?hapikey={API_KEY}", {"Content-Type": "application/json"}),
]:
    try:
        # v2 payload is different
        if "v2" in method_name:
            v2_payload = {
                "name": "Interfaz Inspiratoria - Account Studio",
                "action": "",
                "method": "POST",
                "cssClass": "",
                "redirect": "",
                "submitText": "Solicitar Contacto",
                "followUpId": "",
                "notifyRecipients": "",
                "leadNurturingCampaignId": "",
                "formFieldGroups": [
                    {"fields": [{"name": "firstname", "label": "Nombre", "type": "string", "fieldType": "text", "required": True}]},
                    {"fields": [{"name": "lastname", "label": "Apellido", "type": "string", "fieldType": "text", "required": True}]},
                    {"fields": [{"name": "email", "label": "Email Corporativo", "type": "string", "fieldType": "text", "required": True}]},
                    {"fields": [{"name": "phone", "label": "Teléfono", "type": "string", "fieldType": "text", "required": True}]},
                    {"fields": [{"name": "company", "label": "Empresa", "type": "string", "fieldType": "text", "required": True}]},
                    {"fields": [{"name": "industry", "label": "Industria", "type": "enumeration", "fieldType": "select", "required": True, "options": [
                        {"label": "Tecnología", "value": "technology"},
                        {"label": "Finanzas y Banca", "value": "finance"},
                        {"label": "Retail y Comercio", "value": "retail"},
                        {"label": "Salud", "value": "healthcare"},
                        {"label": "Manufactura", "value": "manufacturing"},
                        {"label": "Minería", "value": "mining"},
                        {"label": "Energía", "value": "energy"},
                        {"label": "Educación", "value": "education"},
                        {"label": "Consultoría", "value": "consulting"},
                        {"label": "Otro", "value": "other"},
                    ]}]},
                    {"fields": [{"name": "numemployees", "label": "Tamaño de Empresa", "type": "enumeration", "fieldType": "select", "required": True, "options": [
                        {"label": "1-50 empleados", "value": "1-50"},
                        {"label": "51-200 empleados", "value": "51-200"},
                        {"label": "201-500 empleados", "value": "201-500"},
                        {"label": "500+ empleados", "value": "500+"},
                    ]}]},
                    {"fields": [{"name": "message", "label": "Mensaje (opcional)", "type": "string", "fieldType": "textarea", "required": False}]},
                ],
            }
            send_data = json.dumps(v2_payload).encode("utf-8")
        else:
            send_data = data
        
        req = urllib.request.Request(url, data=send_data, headers=headers, method="POST")
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            form_id = result.get("id") or result.get("guid")
            portal = result.get("portalId", portal_id)
            print(f"✅ Formulario creado exitosamente! (método: {method_name})")
            print(f"   Form ID: {form_id}")
            print(f"   Portal ID: {portal}")
            print(f"   Nombre: {result.get('name')}")
            print(f"\n📋 Para el frontend, usa:")
            print(f"   PORTAL_ID = \"{portal}\"")
            print(f"   FORM_ID = \"{form_id}\"")
            print(f"\n🔗 URL de submit directo (SIN API KEY):")
            print(f"   https://api.hsforms.com/submissions/v3/integration/submit/{portal}/{form_id}")
            print(f"\n🌐 Ver en HubSpot:")
            print(f"   https://app.hubspot.com/forms/{portal}/editor/{form_id}")
            form_created = True
            break
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"   {method_name}: {e.code} - {error_body[:200]}")

if not form_created:
    print(f"\n❌ No se pudo crear el formulario con ningún método.")
    print(f"\n💡 La clave '{API_KEY}' parece ser una API key legacy.")
    print(f"   HubSpot deprecó las API keys en Nov 2022.")
    print(f"   Necesitas un Private App token (empieza con 'pat-').")
    print(f"\n📌 Para crear uno:")
    print(f"   1. Ve a HubSpot > Settings > Integrations > Private Apps")
    print(f"   2. Create a private app")
    print(f"   3. En Scopes, activa: forms, crm.objects.contacts.write")
    print(f"   4. Copia el token (pat-xxx)")
    print(f"\n🔄 Alternativa: Usar la API de Contacts directamente (YA FUNCIONA)")
    print(f"   Tu integración actual vía /api/studio-inquiry ya crea contactos en HubSpot.")
