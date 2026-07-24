"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300",
  success: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300",
};

export default function AdminPaymentsPage() {
  const [purpose, setPurpose] = useState<string>("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", purpose],
    queryFn: () => api.admin.payments(purpose ? { purpose } : {}),
  });

  const refundMutation = useMutation({
    mutationFn: ({ reference, decision }: { reference: string; decision: "approved" | "rejected" | "refunded" }) =>
      api.admin.resolveRefund(reference, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "payments"] }),
  });

  const totalRevenue = data?.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0) ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-white">Payments</h1>
      <p className="mt-1 text-white/50">Booking payments, viewing service payments, revenue, and refunds.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="" className="text-charcoal-900">All Purposes</option>
          {["booking_fee", "reservation", "consultation", "shortlet_booking", "viewing_fee"].map((p) => (
            <option key={p} value={p} className="text-charcoal-900">
              {p.replace("_", " ")}
            </option>
          ))}
        </select>
        <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
          Total (filtered, successful): {formatPrice(totalRevenue, "NGN")}
        </span>
      </div>

      {isLoading && <p className="mt-8 text-white/50">Loading...</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-white/40">
              <th className="p-3 font-medium">Reference</th>
              <th className="p-3 font-medium">Purpose</th>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Refund</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((payment) => (
              <motion.tr key={payment.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }} className="border-b border-white/5 text-white/80">
                <td className="p-3 font-mono text-xs">{payment.reference}</td>
                <td className="p-3 capitalize">{payment.purpose.replace("_", " ")}</td>
                <td className="p-3 capitalize">{payment.provider}</td>
                <td className="p-3">{formatPrice(payment.amount, payment.currency)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[payment.status]}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="p-3">
                  {payment.refund_status === "requested" ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => refundMutation.mutate({ reference: payment.reference, decision: "refunded" })}
                        className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300"
                      >
                        Refund
                      </button>
                      <button
                        onClick={() => refundMutation.mutate({ reference: payment.reference, decision: "rejected" })}
                        className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs text-red-300"
                      >
                        Deny
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs capitalize text-white/40">{payment.refund_status ?? "none"}</span>
                  )}
                </td>
                <td className="p-3 text-xs text-white/40">{formatDate(payment.created_at)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 && <p className="p-6 text-white/40">No transactions found.</p>}
      </div>
    </div>
  );
}
