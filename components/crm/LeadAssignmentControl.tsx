"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { UserRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Counsellor {
  id: string;
  username: string;
  role: string;
}

interface LeadAssignmentControlProps {
  leadId: string;
  assignedTo: string | null;
  assignedToName: string | null;
}

export default function LeadAssignmentControl({
  leadId,
  assignedTo,
  assignedToName,
}: LeadAssignmentControlProps) {
  const router = useRouter();

  const [members, setMembers] = useState<Counsellor[]>([]);
  const [selectedId, setSelectedId] = useState(assignedTo ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchMembers() {
      try {
        const response = await fetch("/api/admins");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load members.");
        }

        if (active) {
          setMembers(result.admins ?? []);
        }
      } catch (err) {
        if (active) {
          toast.error(
            err instanceof Error ? err.message : "Unable to load members.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchMembers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSelectedId(assignedTo ?? "");
  }, [assignedTo]);

  async function handleAssignment() {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/crm/leads/${leadId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedTo: selectedId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update assignment.");
      }

      toast.success(result.message || "Assignment updated successfully.");

      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update assignment.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanged = selectedId !== (assignedTo ?? "");

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <UserRound size={16} className="text-amber-700" />
            Lead assignment
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            Currently assigned to:{" "}
            <span className="font-semibold text-zinc-700">
              {assignedToName || "Unassigned"}
            </span>
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            disabled={isLoading || isSaving}
            className="h-10 min-w-52 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Unassigned</option>

            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.username}
              </option>
            ))}
          </select>

          <Button
            type="button"
            onClick={handleAssignment}
            disabled={isLoading || isSaving || !hasChanged}
            className="h-10 cursor-pointer bg-amber-600 text-white hover:bg-amber-700 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save assignment"
            )}
          </Button>
        </div>
      </div>

      {isLoading && (
        <p className="mt-2 text-xs text-zinc-500">Loading members...</p>
      )}
    </div>
  );
}
