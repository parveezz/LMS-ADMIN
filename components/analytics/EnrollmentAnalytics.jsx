"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiDollarSign,
  FiInbox,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import { getEnrollmentAnalyticsApi } from "@/lib/analyticsApi";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/enrollment/StatusBadge";

function formatCurrency(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function BreakdownCard({ title, entries }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <div className="mt-4 space-y-2.5">
        {Object.entries(entries || {}).map(([key, count]) => (
          <div
            key={key}
            className="flex items-center justify-between text-sm"
          >
            <StatusBadge status={key} />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {count ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnrollmentAnalytics() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchAnalytics = useCallback(async (filters) => {
    setIsLoading(true);
    setError("");
    setErrorStatus(null);
    setAppliedFilters(filters);
    try {
      const res = await getEnrollmentAnalyticsApi(filters);
      setAnalytics(res?.data || null);
    } catch (err) {
      setAnalytics(null);
      setErrorStatus(err.status ?? null);
      setError(
        err.status === 0
          ? "Unable to reach the server. Please check your connection and try again."
          : err.message || "Unable to load analytics."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getEnrollmentAnalyticsApi({})
      .then((res) => {
        if (active) {
          setAnalytics(res?.data || null);
        }
      })
      .catch((err) => {
        if (active) {
          setAnalytics(null);
          setErrorStatus(err.status ?? null);
          setError(
            err.status === 0
              ? "Unable to reach the server. Please check your connection and try again."
              : err.message || "Unable to load analytics."
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchAnalytics({
      from,
      to,
      course_id: courseId,
      batch_id: batchId,
    });
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    setCourseId("");
    setBatchId("");
    fetchAnalytics({});
  };

  const handleRetry = () => {
    fetchAnalytics(appliedFilters);
  };

  const summary = analytics?.summary || {};
  const trend = Array.isArray(analytics?.trend) ? analytics.trend : [];
  const recent = Array.isArray(analytics?.recent_enrollments)
    ? analytics.recent_enrollments
    : [];
  const maxTrendCount = Math.max(1, ...trend.map((t) => Number(t.count || 0)));
  const hasTrendActivity = trend.some((t) => Number(t.count || 0) > 0);
  const isEmptyData =
    !isLoading &&
    !error &&
    (!analytics ||
      (Number(summary.total_enrollments || 0) === 0 &&
        recent.length === 0 &&
        !hasTrendActivity));

  const kpiCards = [
    {
      label: "Total Enrollments",
      value: summary.total_enrollments ?? 0,
      icon: FiUsers,
    },
    {
      label: "Unassigned Batch",
      value: summary.unassigned_batch_count ?? 0,
      icon: FiAlertCircle,
    },
    {
      label: "Total Fee",
      value: formatCurrency(summary.total_fee),
      icon: FiBarChart2,
    },
    {
      label: "Total Paid",
      value: formatCurrency(summary.total_paid),
      icon: FiCheckCircle,
    },
    {
      label: "Total Pending",
      value: formatCurrency(summary.total_pending),
      icon: FiDollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <form
        onSubmit={handleApplyFilters}
        className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <div>
          <label
            htmlFor="analytics-from"
            className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400"
          >
            From Date
          </label>
          <input
            id="analytics-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#163300] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="analytics-to"
            className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400"
          >
            To Date
          </label>
          <input
            id="analytics-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#163300] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="analytics-course"
            className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400"
          >
            Course ID (UUID)
          </label>
          <input
            id="analytics-course"
            type="text"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="Optional course UUID"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#163300] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="analytics-batch"
            className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400"
          >
            Batch ID (UUID)
          </label>
          <input
            id="analytics-batch"
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="Optional batch UUID"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#163300] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isLoading} className="px-4 py-2">
            Apply
          </Button>
          {(from || to || courseId || batchId) && (
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Loading enrollment analytics...
        </div>
      ) : errorStatus === 403 ? (
        <AccessRestricted
          title="Analytics Access Restricted"
          message={
            error || "You do not have permission to view enrollment analytics."
          }
        />
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-white px-6 py-10 text-center dark:border-red-900/50 dark:bg-zinc-900"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <FiAlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Unable to Load Analytics
          </h3>
          <p className="mt-1 max-w-md text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <Button
            type="button"
            onClick={handleRetry}
            className="mt-4 px-5 py-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : isEmptyData ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <FiInbox className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            No Enrollment Analytics Found
          </h3>
          <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            There is no enrollment data matching the selected filters.
          </p>
          {(from || to || courseId || batchId) && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 cursor-pointer rounded-sm border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {card.label}
                    </span>
                    <Icon className="h-4 w-4 text-[#163300] dark:text-[#9FE870]" />
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Daily Trend Bar Chart */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Enrollment Trend
                </h3>
                <p className="text-xs text-zinc-500">
                  Daily enrollment volume ({trend.length} days)
                </p>
              </div>
            </div>

            {trend.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">
                No trend data for the selected range.
              </p>
            ) : (
              <div className="flex h-40 items-end gap-1 overflow-x-auto pt-4">
                {trend.map((point) => {
                  const count = Number(point.count || 0);
                  const heightPct = Math.max(
                    count > 0 ? 10 : 3,
                    Math.round((count / maxTrendCount) * 100)
                  );
                  return (
                    <div
                      key={point.date}
                      title={`${point.date}: ${count} enrollment(s)`}
                      className="group flex min-w-[10px] flex-1 flex-col items-center justify-end"
                    >
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={[
                          "w-full rounded-t-sm transition-all",
                          count > 0
                            ? "bg-[#9FE870] group-hover:bg-[#163300]"
                            : "bg-zinc-100 dark:bg-zinc-800",
                        ].join(" ")}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BreakdownCard
              title="By Registration Status"
              entries={analytics?.by_registration_status}
            />
            <BreakdownCard
              title="By Enrollment Status"
              entries={analytics?.by_enrollment_status}
            />
            <BreakdownCard
              title="By Payment Status"
              entries={analytics?.by_payment_status}
            />
          </div>

          {/* Recent Enrollments */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Recent Enrollments
              </h3>
              <Link
                href="/enrollments"
                className="text-xs font-semibold text-[#163300] hover:underline dark:text-[#9FE870]"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                    <th className="px-4 py-3">Enrollment #</th>
                    <th className="px-4 py-3">Registration</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Enrollment</th>
                    <th className="px-4 py-3">Fee</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Pending</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {recent.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-zinc-500"
                      >
                        No recent enrollments found.
                      </td>
                    </tr>
                  ) : (
                    recent.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          {item.enrollment_number || item.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.registration_status} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.payment_status} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.enrollment_status} />
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {formatCurrency(item.total_fee)}
                        </td>
                        <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(item.paid_amount)}
                        </td>
                        <td className="px-4 py-3 text-amber-700 dark:text-amber-400">
                          {formatCurrency(item.pending_amount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
