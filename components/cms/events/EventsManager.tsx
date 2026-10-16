"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import type { Event } from "@/types/event";
import { getEvents } from "@/services/event.service";
import EventForm from "./EventForm";

export default function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);

      const data = await getEvents();

      setEvents(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = () => {
    setSelectedEvent(null);
    // setShowForm(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    // setShowForm(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/cms/events/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to delete event");
      }

      toast.success("Event deleted successfully");

      setEvents((current) => current.filter((event) => event._id !== id));

      if (selectedEvent?._id === id) {
        setSelectedEvent(null);
        setEventToDelete(null);
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to delete event",
      );
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  const handleSuccess = async () => {
    // setShowForm(false);
    setSelectedEvent(null);

    await fetchEvents();
  };

  const handleCancel = () => {
    // setShowForm(false);
    setSelectedEvent(null);
  };

  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-950">
            {selectedEvent ? "Edit Event" : "Add Event"}
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {selectedEvent
              ? "Update the event details and save your changes."
              : "Add an event to the website."}
          </p>
        </div>
        <EventForm
          event={selectedEvent}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Events</h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage events, registration forms and event content.
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
              <CalendarDays className="h-6 w-6 text-zinc-500" />
            </div>

            <h3 className="text-sm font-semibold text-zinc-900">
              No events yet
            </h3>

            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Create your first event to start accepting registrations.
            </p>

            <button
              type="button"
              onClick={handleCreate}
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Event
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Date
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Time
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {events.map((event) => (
                  <tr key={event._id} className="transition hover:bg-zinc-50">
                    {/* Event */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {event.cardImage ? (
                          <img
                            src={event.cardImage.url}
                            alt={event.title}
                            className="h-12 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-zinc-100">
                            <CalendarDays className="h-5 w-5 text-zinc-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {event.title}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            /{event.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                      {formatDate(event.eventDate)}
                    </td>

                    {/* Time */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                      {event.eventTime || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                          event.status.toLowerCase() === "published"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-600"
                            : "bg-amber-100 text-amber-700 border border-amber-600"
                        } capitalize`}
                      >
                        {event.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(event)}
                          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEventToDelete(event)}
                          disabled={deletingId === event._id}
                          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {eventToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEventToDelete(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">
              Delete Event?
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This will permanently delete{" "}
              <span className="font-medium text-zinc-700">
                {eventToDelete.title}
              </span>{" "}
              and its uploaded images.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
                className="h-10 cursor-pointer rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDelete(eventToDelete._id)}
                disabled={isDeleting}
                className="h-10 cursor-pointer rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
