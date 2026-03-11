# 🗄️ Configuración de Base de Datos PostgreSQL en Render

## ✅ IMPORTANTE: Los datos ahora son PERSISTENTES

Con esta configuración, **los datos NO se borrarán** al hacer commits o deploys. PostgreSQL en Render es una base de datos persistente que mantiene todos los datos entre deploys.

## 📋 Configuración en Render

### 1. Crear Base de Datos PostgreSQL en Render

En el dashboard de Render, crea una nueva base de datos PostgreSQL con estos valores:

- **Name**: `inspiratoria-db`
- **Database**: `inspiratoria`
- **User**: `inspiratoria`
- **Region**: `Oregon (US West)`
- **Plan**: 
  - **Free** (para testing, con limitaciones)
  - **Basic-256mb** ($10.50/mes) - Recomendado para producción

### 2. Conexión Automática

El archivo `render.yaml` ya está configurado para conectar automáticamente el backend a la base de datos:

```yaml
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: inspiratoria-db
      property: connectionString
```

## 🔄 Cómo Funciona

### Desarrollo Local (Tu computadora)
- Usa **SQLite** (`db.sqlite3`)
- Los datos están en tu computadora
- Perfecto para desarrollo y testing

### Producción (Render)
- Usa **PostgreSQL** automáticamente
- Los datos están en la nube de Render
- **PERSISTENTES** - No se borran al hacer deploy

## 🚀 Flujo de Deploy

### Cada vez que hagas `git push`:

1. ✅ El código se actualiza en Render
2. ✅ Las migraciones se ejecutan automáticamente
3. ✅ **Los datos existentes se mantienen intactos**
4. ✅ Solo se aplican las nuevas migraciones (si hay)

### Primera vez después de crear la BD:

```bash
# 1. Crear la base de datos en Render Dashboard
# 2. Push del código
git add .
git commit -m "Configurar PostgreSQL para persistencia de datos"
git push origin main

# 3. Render automáticamente:
#    - Instala psycopg2-binary
#    - Conecta a PostgreSQL
#    - Ejecuta migraciones
#    - Inicia el servidor
```

## 🔐 Variables de Entorno (Ya configuradas)

El backend ya está configurado para usar automáticamente la variable `DATABASE_URL` que Render proporciona:

```python
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",  # Local: SQLite
        conn_max_age=600,
        conn_health_checks=True,
    )
}
```

- **Local**: Sin `DATABASE_URL` → Usa SQLite
- **Render**: Con `DATABASE_URL` → Usa PostgreSQL

## 📦 Paquetes Instalados

Ya agregados a `requirements.txt`:

- `psycopg2-binary>=2.9.9` - Driver de PostgreSQL
- `dj-database-url>=2.1.0` - Parser de DATABASE_URL
- `gunicorn>=21.2.0` - Servidor WSGI para producción

## ⚠️ Notas Importantes

### Los datos NO se borran cuando:
- ✅ Haces `git push`
- ✅ Haces deploy manual
- ✅ Render reinicia el servicio
- ✅ Actualizas el código
- ✅ Modificas variables de entorno
- ✅ Cambias el plan de servicio

### Los datos SÍ se borran cuando:
- ❌ Eliminas la base de datos en Render Dashboard
- ❌ Haces un "wipe" manual de la BD
- ❌ Cambias a un plan Free (después de 90 días)

### Plan Free de PostgreSQL:
- **Almacenamiento**: 1 GB
- **Conexiones**: 97 simultáneas
- **Duración**: 90 días, luego expira
- **Backup**: No incluido
- **Recomendación**: Usar Basic ($6/mes) para producción real

## 🎯 Próximos Pasos

1. **Crear la base de datos** en Render Dashboard
2. **Hacer commit** de estos cambios
3. **Push a GitHub**: `git push origin main`
4. Render detectará el cambio y:
   - Instalará las dependencias
   - Conectará a PostgreSQL
   - Ejecutará migraciones
   - Creará las tablas automáticamente

## 📝 Comandos Útiles

### Ver logs en Render:
```bash
# En el dashboard de Render, haz clic en "Logs" para ver:
# - Conexión a PostgreSQL
# - Migraciones aplicadas
# - Errores (si hay)
```

### Ejecutar migraciones manualmente (si es necesario):
```bash
# En el shell de Render (Dashboard > Shell):
python manage.py migrate
```

### Crear superusuario en producción:
```bash
# En el shell de Render:
python manage.py createsuperuser
```

## ✅ Verificación

Después del deploy, verifica que todo funcione:

1. **Backend**: `https://inspiratoria-backend.onrender.com/api/`
2. **Login**: Prueba crear un admin en `/register`
3. **Login**: Prueba iniciar sesión con ese admin
4. **Persistencia**: Los datos deben permanecer después de hacer otro deploy

## 🆘 Troubleshooting

### Error: "could not connect to server"
- Verifica que la base de datos esté creada en Render
- Revisa que el nombre sea exactamente `inspiratoria-db`

### Error: "relation does not exist"
- Las migraciones no se ejecutaron
- Revisa los logs de build en Render
- Ejecuta manualmente: `python manage.py migrate`

### Los datos desaparecen
- Verifica que estés usando el plan correcto (no Free después de 90 días)
- Revisa que la base de datos no se haya eliminado en Render Dashboard
