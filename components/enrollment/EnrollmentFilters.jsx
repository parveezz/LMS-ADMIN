"use client";

import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiLogOut,
  FiUserCheck,
  FiXCircle,
} from "react-icons/fi";
import { CommandSearch } from "./CommandSearch";
import { FilterDisclosure } from "./FilterDisclosure";

const ENROLLMENT_FILTER_ITEMS = [
  { id: "pending", label: "Pending", icon: <FiClock className="h-4 w-4" /> },
  {
    id: "confirmed",
    label: "Confirmed",
    icon: <FiCheckCircle className="h-4 w-4" />,
  },
  { id: "deferred", label: "Deferred", icon: <FiCalendar className="h-4 w-4" /> },
  { id: "dropped", label: "Dropped", icon: <FiXCircle className="h-4 w-4" /> },
  { id: "withdrawn", label: "Withdrawn", icon: <FiLogOut className="h-4 w-4" /> },
  { id: "completed", label: "Completed", icon: <FiAward className="h-4 w-4" /> },
];

const REGISTRATION_FILTER_ITEMS = [
  { id: "pending", label: "Pending", icon: <FiClock className="h-4 w-4" /> },
  {
    id: "registered",
    label: "Registered",
    icon: <FiCheckCircle className="h-4 w-4" />,
  },
  {
    id: "cancelled",
    label: "Cancelled",
    icon: <FiXCircle className="h-4 w-4" />,
  },
];

const PAYMENT_FILTER_ITEMS = [
  { id: "unpaid", label: "Unpaid", icon: <FiClock className="h-4 w-4" /> },
  { id: "partial", label: "Partial", icon: <FiDollarSign className="h-4 w-4" /> },
  { id: "paid", label: "Paid", icon: <FiCheckCircle className="h-4 w-4" /> },
  { id: "overdue", label: "Overdue", icon: <FiXCircle className="h-4 w-4" /> },
  { id: "refunded", label: "Refunded", icon: <FiLogOut className="h-4 w-4" /> },
];

export function EnrollmentFilters({
  search,
  registrationStatus,
  paymentStatus,
  enrollmentStatus,
  onSearchChange,
  onRegistrationStatusChange,
  onPaymentStatusChange,
  onEnrollmentStatusChange,
  onOpenCreate,
  onReset,
}) {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(registrationStatus) ||
    Boolean(paymentStatus) ||
    Boolean(enrollmentStatus);

  const commandItems = [
    ...(onOpenCreate
      ? [
        {
          id: "new-enrollment",
          title: "Create New Enrollment",
          section: "Quick Actions",
          shortcut: "N",
          action: onOpenCreate,
        },
      ]
      : []),
    {
      id: "reg-pending",
      title: "Pending Registration",
      section: "Suggestions",
      action: () => onRegistrationStatusChange("pending"),
    },
    {
      id: "pay-unpaid",
      title: "Unpaid Enrollments",
      section: "Suggestions",
      action: () => onPaymentStatusChange("unpaid"),
    },
    {
      id: "pay-overdue",
      title: "Overdue Payments",
      section: "Suggestions",
      action: () => onPaymentStatusChange("overdue"),
    },
    {
      id: "status-confirmed",
      title: "Confirmed Enrollments",
      section: "Suggestions",
      action: () => onEnrollmentStatusChange("confirmed"),
    },
    {
      id: "clear-filters",
      title: "Clear All Filters",
      section: "Actions",
      action: onReset,
    },
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Filter 1: Search */}
      <div className="flex-1 lg:max-w-sm">
        <CommandSearch
          value={search}
          onChange={onSearchChange}
          items={commandItems}
          placeholder="Search enrollment # or notes..."
        />
      </div>

      {/* Filters 2, 3, 4: Enrollment, Registration, Payment */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDisclosure
          defaultLabel="Enrollment"
          items={ENROLLMENT_FILTER_ITEMS}
          selectedId={enrollmentStatus}
          onSelect={onEnrollmentStatusChange}
        />

        <FilterDisclosure
          defaultLabel="Registration"
          items={REGISTRATION_FILTER_ITEMS}
          selectedId={registrationStatus}
          onSelect={onRegistrationStatusChange}
          triggerIcon={<FiUserCheck className="h-4 w-4 shrink-0" />}
        />

        <FilterDisclosure
          defaultLabel="Payment"
          items={PAYMENT_FILTER_ITEMS}
          selectedId={paymentStatus}
          onSelect={onPaymentStatusChange}
          triggerIcon={<FiCreditCard className="h-4 w-4 shrink-0" />}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
