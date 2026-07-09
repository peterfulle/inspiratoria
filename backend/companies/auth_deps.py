"""
Dependencias de autenticación/autorización reutilizables para los endpoints
de FastAPI/django-ninja del backend.

Todas las funciones acá son SÍNCRONAS (usan el ORM de Django directamente,
igual que AuthService). En un endpoint `async def`, llamalas envueltas en
`sync_to_async`, ej:

    user = await sync_to_async(get_current_user)(authorization)

En un endpoint sync (`def`), llamalas directo:

    user = get_current_user(authorization)
"""
from typing import Optional

from fastapi import HTTPException

from .models import User
from .services import AuthService

ADMIN_ROLES = {"superadmin", "admin_root", "inspiratoria_admin"}


def get_current_user(authorization: Optional[str]) -> User:
    """Requiere una sesión válida (AuthToken no expirado/revocado). Lanza 401 si no."""
    user = AuthService.verify_session_token(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Requiere sesión válida")
    return user


def is_admin(user: User) -> bool:
    return user.role in ADMIN_ROLES or user.is_superuser


def require_admin(authorization: Optional[str]) -> User:
    """Requiere sesión válida Y rol de administrador. Lanza 401/403."""
    user = get_current_user(authorization)
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Requiere permisos de administrador")
    return user


def require_company_access(user: User, company_id) -> None:
    """
    Requiere que el usuario pertenezca a `company_id`, o sea admin de
    Inspiratoria (los admins pueden operar sobre cualquier empresa). Lanza
    403 si un usuario de una empresa intenta acceder a datos de otra.
    """
    if is_admin(user):
        return
    if user.company_id is None or str(user.company_id) != str(company_id):
        raise HTTPException(status_code=403, detail="No tenés acceso a esta empresa")


def require_self_or_admin(user: User, target_user_id) -> None:
    """Requiere que el usuario sea el mismo `target_user_id`, o admin."""
    if is_admin(user):
        return
    if str(user.id) != str(target_user_id):
        raise HTTPException(status_code=403, detail="No tenés acceso a este recurso")


def require_program_access(user: User, program_id):
    """Requiere que el Program exista y pertenezca a la empresa del usuario
    (o que sea admin). Devuelve la instancia de Program ya resuelta, para que
    el endpoint no tenga que volver a buscarla."""
    from programs.models import Program
    try:
        program = Program.objects.select_related("company").get(id=program_id)
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    require_company_access(user, program.company_id)
    return program
