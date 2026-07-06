"""
WebSocket server para chat en tiempo real
"""
import socketio
from datetime import datetime
from asgiref.sync import sync_to_async

# Crear servidor Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Almacenar mensajes en memoria (en producción usar base de datos)
match_rooms = {}  # {match_id: [messages]}


@sio.event
async def connect(sid, environ):
    """Cliente conectado"""
    print(f"Cliente conectado: {sid}")
    await sio.emit('connection_success', {'sid': sid}, room=sid)


@sio.event
async def disconnect(sid):
    """Cliente desconectado"""
    print(f"Cliente desconectado: {sid}")
    if sid in team_chat_sids:
        team_chat_sids.pop(sid, None)
        await sio.emit('team_chat_presence', list(team_chat_sids.values()), room=TEAM_CHAT_ROOM)


@sio.event
async def join_match(sid, data):
    """Usuario se une a una sala de match"""
    match_id = data.get('match_id')
    user_id = data.get('user_id')
    
    if not match_id:
        await sio.emit('error', {'message': 'match_id requerido'}, room=sid)
        return
    
    # Unirse a la sala
    room = f"match_{match_id}"
    await sio.enter_room(sid, room)
    
    print(f"Usuario {user_id} se unió al match {match_id}")
    
    # Enviar mensajes previos
    previous_messages = match_rooms.get(match_id, [])
    await sio.emit('previous_messages', previous_messages, room=sid)
    
    # Notificar a otros en la sala
    await sio.emit('user_joined', {
        'user_id': user_id,
        'match_id': match_id
    }, room=room, skip_sid=sid)


@sio.event
async def send_message(sid, data):
    """Enviar mensaje en el chat"""
    match_id = data.get('match_id')
    sender_id = data.get('sender_id')
    sender_name = data.get('sender_name')
    content = data.get('content')
    
    if not all([match_id, sender_id, content]):
        await sio.emit('error', {'message': 'Datos incompletos'}, room=sid)
        return
    
    # Crear mensaje
    message = {
        'id': len(match_rooms.get(match_id, [])) + 1,
        'sender_id': sender_id,
        'sender_name': sender_name,
        'content': content,
        'created_at': datetime.now().isoformat(),
        'is_read': False
    }
    
    # Guardar mensaje
    if match_id not in match_rooms:
        match_rooms[match_id] = []
    match_rooms[match_id].append(message)
    
    # Enviar mensaje a todos en la sala
    room = f"match_{match_id}"
    await sio.emit('new_message', message, room=room)
    
    # Confirmar al emisor
    await sio.emit('message_sent', message, room=sid)
    
    print(f"Mensaje enviado en match {match_id}: {content[:50]}...")


@sio.event
async def leave_match(sid, data):
    """Usuario sale de una sala de match"""
    match_id = data.get('match_id')
    user_id = data.get('user_id')
    
    if match_id:
        room = f"match_{match_id}"
        await sio.leave_room(sid, room)
        
        # Notificar a otros en la sala
        await sio.emit('user_left', {
            'user_id': user_id,
            'match_id': match_id
        }, room=room)
        
        print(f"Usuario {user_id} salió del match {match_id}")


# ══════════════════════════════════════════════════════════════════
# CHAT DE EQUIPO — canal único, persistente en DB, restringido a
# usuarios activos con email @inspiratoria.org
# ══════════════════════════════════════════════════════════════════

TEAM_CHAT_ROOM = "team_chat"
team_chat_sids = {}  # sid -> {"id": str, "name": str, "email": str}


def _is_inspiratoria_staff(user) -> bool:
    return bool(user) and user.is_active and (user.email or "").lower().endswith("@inspiratoria.org")


def _team_chat_history_sync(limit=50):
    from django.db import close_old_connections
    from companies.models import TeamChatMessage
    close_old_connections()
    qs = list(TeamChatMessage.objects.select_related("sender").order_by("-created_at")[:limit])
    return [
        {
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "sender_name": m.sender.full_name or m.sender.email,
            "sender_email": m.sender.email,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(qs)
    ]


def _lookup_user_sync(user_id):
    from django.db import close_old_connections
    from companies.models import User
    close_old_connections()
    try:
        return User.objects.get(id=user_id)
    except Exception:
        return None


def _save_team_message_sync(user_id, content):
    from django.db import close_old_connections
    from companies.models import User, TeamChatMessage
    close_old_connections()
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
    if not _is_inspiratoria_staff(user):
        return None
    return TeamChatMessage.objects.create(sender=user, content=content)


@sio.event
async def join_team_chat(sid, data):
    """Une al cliente al canal de chat del equipo, si es staff de Inspiratoria."""
    user_id = (data or {}).get('user_id')
    user = None
    if user_id:
            user = await sync_to_async(_lookup_user_sync)(user_id)

    if not _is_inspiratoria_staff(user):
        await sio.emit('team_chat_denied', {
            'message': 'Este chat es exclusivo para el equipo de Inspiratoria (@inspiratoria.org).'
        }, room=sid)
        return

    await sio.enter_room(sid, TEAM_CHAT_ROOM)
    team_chat_sids[sid] = {
        "id": str(user.id),
        "name": user.full_name or user.email,
        "email": user.email,
    }

    history = await sync_to_async(_team_chat_history_sync)(50)
    await sio.emit('team_chat_history', history, room=sid)
    await sio.emit('team_chat_presence', list(team_chat_sids.values()), room=TEAM_CHAT_ROOM)


@sio.event
async def send_team_message(sid, data):
    """Persiste y transmite un mensaje del chat de equipo."""
    info = team_chat_sids.get(sid)
    if not info:
        await sio.emit('team_chat_denied', {'message': 'Debes unirte al chat primero.'}, room=sid)
        return

    content = ((data or {}).get('content') or '').strip()
    if not content or len(content) > 4000:
        return

    msg = await sync_to_async(_save_team_message_sync)(info['id'], content)
    if not msg:
        await sio.emit('team_chat_denied', {'message': 'Acceso restringido al equipo de Inspiratoria.'}, room=sid)
        return

    payload = {
        "id": str(msg.id),
        "sender_id": info['id'],
        "sender_name": info['name'],
        "sender_email": info['email'],
        "content": content,
        "created_at": msg.created_at.isoformat(),
    }
    await sio.emit('team_chat_message', payload, room=TEAM_CHAT_ROOM)


@sio.event
async def leave_team_chat(sid, data=None):
    """Sale del canal (sin desconectar el socket)."""
    if sid in team_chat_sids:
        await sio.leave_room(sid, TEAM_CHAT_ROOM)
        team_chat_sids.pop(sid, None)
        await sio.emit('team_chat_presence', list(team_chat_sids.values()), room=TEAM_CHAT_ROOM)


# Crear app ASGI
socket_app = socketio.ASGIApp(sio, socketio_path='/socket.io')
