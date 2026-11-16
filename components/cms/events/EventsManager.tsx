"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { toast } from "react-toastify";

import type { Event } from "@/types/event";
import EventForm from "./EventForm";
import StatusSwitch, {
  StatusType,
} from "@/components/Common Components/StatusSwitch";
import { formatDate } from "@/helpers/date";
import DataTable from "@/components/Common Components/DataTable";
import { DataTableColumn } from "@/types/dataTable";

export default function EventsManager() {
  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [fetchError, setFetchError] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  type EventPageData = {
    events: typeof events;
    totalEvents: number;
    totalPages: number;
  };

  const pageCache = useRef(new Map<string, EventPageData>());

  const requestControllers = useRef(new Map<string, AbortController>());

  const getCacheKey = (page: number, search: string) =>
    `${search.trim().toLowerCase()}-${page}`;

  // Fetch events from API.
  const getEventsPage = useCallback(
    async (
      page: number,
      search: string,
      signal?: AbortSignal,
    ): Promise<EventPageData> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/cms/events?${params.toString()}`, {
        signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to fetch events");
      }

      return {
        events: result.data,
        totalEvents: result.pagination.total,
        totalPages: Math.max(1, result.pagination.totalPages),
      };
    },
    [],
  );

  // Prefetch a page.
  const prefetchPage = useCallback(
    async (page: number, search: string) => {
      if (page < 1) return;

      const key = getCacheKey(page, search);

      if (pageCache.current.has(key) || requestControllers.current.has(key)) {
        return;
      }

      const controller = new AbortController();

      requestControllers.current.set(key, controller);

      try {
        const result = await getEventsPage(page, search, controller.signal);

        pageCache.current.set(key, result);
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          console.error("Event prefetch failed:", error);
        }
      } finally {
        if (requestControllers.current.get(key) === controller) {
          requestControllers.current.delete(key);
        }
      }
    },
    [getEventsPage],
  );

  // Prefetch previous and next pages.
  const prefetchAdjacentPages = useCallback(
    (page: number, search: string, totalPages: number) => {
      if (page > 1) {
        void prefetchPage(page - 1, search);
      }

      if (page < totalPages) {
        void prefetchPage(page + 1, search);
      }
    },
    [prefetchPage],
  );

  // Main fetch function.
  const fetchEvents = useCallback(
    async (signal?: AbortSignal, forceRefresh = false) => {
      const key = getCacheKey(currentPage, debouncedSearch);

      if (forceRefresh) {
        pageCache.current.delete(key);
      }

      // Use cached data immediately.
      const cached = pageCache.current.get(key);

      if (cached) {
        setEvents(cached.events);
        setTotalEvents(cached.totalEvents);
        setTotalPages(cached.totalPages);
        setFetchError("");
        setIsLoading(false);

        prefetchAdjacentPages(currentPage, debouncedSearch, cached.totalPages);

        return;
      }

      try {
        setIsLoading(true);
        setFetchError("");

        const result = await getEventsPage(
          currentPage,
          debouncedSearch,
          signal,
        );

        if (signal?.aborted) return;

        pageCache.current.set(key, result);

        setEvents(result.events);
        setTotalEvents(result.totalEvents);
        setTotalPages(result.totalPages);

        // Prepare neighboring pages in background.
        prefetchAdjacentPages(currentPage, debouncedSearch, result.totalPages);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("FETCH EVENTS ERROR:", error);

        const message =
          error instanceof Error ? error.message : "Failed to fetch events";

        setFetchError(message);
        setEvents([]);
        toast.error(message);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [currentPage, debouncedSearch, getEventsPage, prefetchAdjacentPages],
  );

  // Fetch whenever page, search, or refresh changes.
  useEffect(() => {
    const controller = new AbortController();

    fetchEvents(controller.signal, refreshKey > 0);

    return () => controller.abort();
  }, [fetchEvents, refreshKey]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

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

  const handleEventStatusChange = async (
    eventId: string,
    newStatus: StatusType,
  ) => {
    try {
      const response = await fetch(`/api/cms/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update event status.");
      }

      const updatedEvent = result.data;

      if (!updatedEvent?._id) {
        throw new Error("Invalid event response.");
      }

      setEvents((prev) =>
        prev.map((event) =>
          event._id === updatedEvent._id ? updatedEvent : event,
        ),
      );

      toast.success(
        `Event ${newStatus === "published" ? "published" : "moved to draft"} successfully`,
      );
    } catch (error) {
      console.error("UPDATE EVENT STATUS ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update event status.",
      );
    }
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
    setSelectedEvent(null);

    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    await fetchEvents();
  };

  const handleCancel = () => {
    // setShowForm(false);
    setSelectedEvent(null);
  };

  const eventColumns: DataTableColumn<Event>[] = [
    {
      key: "event",
      header: "Event",
      cellClassName: "min-w-65",
      render: (event) => (
        <div className="flex items-center gap-3">
          {event.cardImage ? (
            <img
              src={event.cardImage.url}
              alt={event.title}
              className="h-12 w-16 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
              <CalendarDays className="h-5 w-5 text-zinc-400" />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900">{event.title}</p>

            <p className="mt-0.5 truncate text-xs text-zinc-500">
              /{event.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      cellClassName: "whitespace-nowrap text-zinc-600",
      render: (event) => formatDate(event.eventDate),
    },
    {
      key: "time",
      header: "Time",
      cellClassName: "whitespace-nowrap text-zinc-600",
      render: (event) => event.eventTime || "—",
    },
    {
      key: "status",
      header: "Status",
      cellClassName: "whitespace-nowrap",
      render: (event) => (
        <StatusSwitch
          status={event.status}
          size="sm"
          onChange={(newStatus) =>
            handleEventStatusChange(event._id, newStatus)
          }
        />
      ),
    },
  ];

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
      <DataTable
        columns={eventColumns}
        data={events}
        getRowKey={(event) => event._id}
        loading={isLoading}
        minWidth="900px"
        toolbar={{
          title: `Events (${totalEvents})`,
          description: "Manage events, registration forms and event content.",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Search events...",
          refreshing: isLoading,
          onRefresh: () => setRefreshKey((prev) => prev + 1),
        }}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
        emptyState={
          fetchError ? (
            <p className="text-sm text-red-600">{fetchError}</p>
          ) : debouncedSearch ? (
            <div>
              <p className="text-sm font-medium text-zinc-700">
                No events found
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Try searching with a different keyword.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
                <CalendarDays className="h-6 w-6 text-zinc-500" />
              </div>

              <p className="text-sm font-semibold text-zinc-900">
                No events yet
              </p>

              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Create your first event to start accepting registrations.
              </p>

              <button
                type="button"
                onClick={handleCreate}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </button>
            </div>
          )
        }
        actions={{
          onEdit: handleEdit,
          onDelete: (event) => setEventToDelete(event),
          editTitle: "Edit event",
          deleteTitle: "Delete event",
        }}
      />

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
