"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminAuditLogsAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

interface AuditLogEntry {
  _id: string;
  actor?: { fullname: string; email: string; role: string };
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const ACTION_STYLES: Record<string, string> = {
  LOGIN_SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOGIN_FAILED: "bg-red-50 text-red-700 border-red-200",
  ACCOUNT_LOCKED: "bg-orange-50 text-orange-700 border-orange-200",
  ACCOUNT_UNLOCKED: "bg-blue-50 text-blue-700 border-blue-200",
  MFA_ENABLED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MFA_DISABLED: "bg-slate-50 text-slate-600 border-slate-200",
  MFA_LOGIN_FAILED: "bg-red-50 text-red-700 border-red-200",
  PASSWORD_RESET_REQUESTED: "bg-slate-50 text-slate-600 border-slate-200",
  PASSWORD_RESET: "bg-blue-50 text-blue-700 border-blue-200",
  USER_SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200",
  USER_REACTIVATED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  USER_DELETED: "bg-red-50 text-red-700 border-red-200",
  REFUND_ISSUED: "bg-purple-50 text-purple-700 border-purple-200",
  DISPUTE_REJECTED: "bg-slate-50 text-slate-600 border-slate-200",
};

function formatAction(action: string) {
  return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminAuditLogsAction({ page, limit });
    if (res.success) {
      setLogs(res.data.items);
      setTotal(res.data.total);
    }
    setLoading(false);
  }, [page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Loading..." : `${total} recorded ${total === 1 ? "event" : "events"}`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3 font-medium">Actor</th>
              <th className="px-3 py-3 font-medium">Action</th>
              <th className="px-3 py-3 font-medium">Target</th>
              <th className="px-3 py-3 font-medium">IP</th>
              <th className="px-3 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-400">
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-400">
                  No audit events recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 align-top">
                  <td className="px-3 py-3 whitespace-nowrap">
                    {log.actor ? (
                      <>
                        <p className="font-medium text-slate-900 text-sm">{log.actor.fullname}</p>
                        <p className="text-xs text-slate-500">{log.actor.email}</p>
                      </>
                    ) : (
                      <span className="text-slate-400 text-sm">Unauthenticated</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        ACTION_STYLES[log.action] || "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600 text-sm whitespace-nowrap">
                    {log.targetType ? `${log.targetType} (${log.targetId?.slice(-6)})` : "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-500 text-sm whitespace-nowrap font-mono">{log.ip || "—"}</td>
                  <td className="px-3 py-3 text-slate-500 text-sm whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}