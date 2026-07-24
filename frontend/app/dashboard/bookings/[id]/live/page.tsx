"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { LiveViewing } from "@/components/live-viewing";

export default function LiveViewingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.bookings.get(id),
  });

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["live-session", id],
    queryFn: () => api.bookings.getLiveSession(id),
    enabled: Boolean(booking),
  });

  if (bookingLoading || sessionLoading) return <p className="text-white/50">Loading live session...</p>;

  if (!booking || !session) {
    return <p className="text-white/50">No live session found for this booking.</p>;
  }

  const remoteUserId = user?.id === booking.customer_id ? booking.agent?.user_id : booking.customer_id;

  if (!remoteUserId) {
    return <p className="text-white/50">Could not determine the other participant for this call.</p>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-white">
        Live Video Tour — {booking.property?.title}
      </h1>
      <p className="mt-1 text-white/50">
        HD peer-to-peer video with live chat. Nothing is recorded unless you explicitly save it.
      </p>

      <div className="mt-6">
        <LiveViewing bookingId={booking.id} sessionToken={session.session_token} remoteUserId={remoteUserId} />
      </div>
    </div>
  );
}
