"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Match } from "@/lib/api";

interface CalendarViewProps {
  matches: Match[];
  darkMode?: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: any;
}

export default function CalendarView({ matches, darkMode = false }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventData, setNewEventData] = useState<{
    date: string;
    match?: Match;
  } | null>(null);

  useEffect(() => {
    // Generar eventos desde los matches
    const calendarEvents: CalendarEvent[] = [];

    matches.forEach((match) => {
      // Agregar eventos de ejemplo (en producción vendrían de la BD)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);

      calendarEvents.push({
        id: `meeting-${match.id}`,
        title: `Reunión: ${match.mentor.full_name} ↔ ${match.mentee.full_name}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: "#FFD902",
        borderColor: "#000000",
        extendedProps: {
          match,
          type: "meeting",
        },
      });
    });

    setEvents(calendarEvents);
  }, [matches]);

  const handleDateClick = (arg: any) => {
    setNewEventData({
      date: arg.dateStr,
    });
    setShowEventModal(true);
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      extendedProps: clickInfo.event.extendedProps,
    });
    setShowEventModal(true);
  };

  const createEvent = (matchId: number, date: string, time: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const [hours, minutes] = time.split(":");
    const startDate = new Date(date);
    startDate.setHours(parseInt(hours), parseInt(minutes));
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const newEvent: CalendarEvent = {
      id: `meeting-${Date.now()}`,
      title: `Reunión: ${match.mentor.full_name} ↔ ${match.mentee.full_name}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      backgroundColor: "#FFD902",
      borderColor: "#000000",
      extendedProps: { match, type: "meeting" },
    };

    setEvents([...events, newEvent]);
    setShowEventModal(false);
    setNewEventData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Calendario de Reuniones</h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Programa y visualiza reuniones mentor-mentee
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className={`rounded-xl border p-6 ${
        darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
      }`}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          locale="es"
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
        />
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-xl border p-6 shadow-2xl ${
            darkMode
              ? "border-gray-700 bg-dark-400"
              : "border-gray-200 bg-white"
          }`}>
            {selectedEvent ? (
              // Ver evento existente
              <>
                <h3 className="text-xl font-bold mb-4">Detalles del Evento</h3>
                <div className="space-y-3">
                  <div>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Título</p>
                    <p className="font-semibold">{selectedEvent.title}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Inicio</p>
                    <p className="font-semibold">
                      {new Date(selectedEvent.start).toLocaleString("es-ES")}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Fin</p>
                    <p className="font-semibold">
                      {new Date(selectedEvent.end).toLocaleString("es-ES")}
                    </p>
                  </div>
                  {selectedEvent.extendedProps?.match && (
                    <div className={`rounded-lg border p-3 ${
                      darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"
                    }`}>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>Match</p>
                      <p className="text-sm font-medium">
                        {selectedEvent.extendedProps.match.mentor.full_name}
                        {" ↔ "}
                        {selectedEvent.extendedProps.match.mentee.full_name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setEvents(events.filter(e => e.id !== selectedEvent.id));
                      setShowEventModal(false);
                      setSelectedEvent(null);
                    }}
                    className={`flex-1 rounded-lg border px-4 py-2 font-semibold transition ${
                      darkMode
                        ? "border-red-500 text-red-500 hover:bg-red-500/10"
                        : "border-red-500 text-red-500 hover:bg-red-500/10"
                    }`}
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setSelectedEvent(null);
                    }}
                    className="flex-1 rounded-lg bg-primary-500 px-4 py-2 font-semibold text-black transition hover:bg-primary-400"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              // Crear nuevo evento
              <>
                <h3 className="text-xl font-bold mb-4">Programar Reunión</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const matchId = parseInt(formData.get("match") as string);
                    const time = formData.get("time") as string;
                    createEvent(matchId, newEventData?.date || "", time);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={newEventData?.date || ""}
                      readOnly
                      className={`w-full rounded-lg border px-4 py-2 ${
                        darkMode
                          ? "border-gray-700 bg-dark-300 text-white"
                          : "border-gray-300 bg-white text-black"
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Hora
                    </label>
                    <input
                      type="time"
                      name="time"
                      required
                      defaultValue="10:00"
                      className={`w-full rounded-lg border px-4 py-2 ${
                        darkMode
                          ? "border-gray-700 bg-dark-300 text-white"
                          : "border-gray-300 bg-white text-black"
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Match
                    </label>
                    <select
                      name="match"
                      required
                      className={`w-full rounded-lg border px-4 py-2 ${
                        darkMode
                          ? "border-gray-700 bg-dark-300 text-white"
                          : "border-gray-300 bg-white text-black"
                      }`}
                    >
                      <option value="">Seleccionar match...</option>
                      {matches.map((match) => (
                        <option key={match.id} value={match.id}>
                          {match.mentor.full_name} ↔ {match.mentee.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEventModal(false);
                        setNewEventData(null);
                      }}
                      className={`flex-1 rounded-lg border px-4 py-2 font-semibold transition ${
                        darkMode
                          ? "border-gray-600 text-gray-300 hover:border-gray-500"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-primary-500 px-4 py-2 font-semibold text-black transition hover:bg-primary-400"
                    >
                      Crear Reunión
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
