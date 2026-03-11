"""
WebSocket server para chat en tiempo real
"""
import socketio
from datetime import datetime

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


# Crear app ASGI
socket_app = socketio.ASGIApp(sio, socketio_path='/socket.io')
