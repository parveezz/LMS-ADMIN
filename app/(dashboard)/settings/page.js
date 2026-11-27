"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiGlobe,
  FiRefreshCw,
  FiRotateCcw,
  FiSave,
  FiSliders,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { getSettingsApi, updateSettingsApi } from "@/lib/settingsApi";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/Button";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: FiGlobe },
  { id: "system", label: "System", icon: FiSliders },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

const LABEL_CLASS = "mb-1 block text-xs font-semibold text-text-secondary";

function extractSettingsState(data) {
  const general = data?.settings?.general || {};
  const system = data?.settings?.system || {};
  const items = Array.isArray(data?.items) ? data.items : [];

  const meta = {};
  for (const item of items) {
    if (item?.key) {
      meta[item.key] = item;
    }
  }

  const values = {
    platform_name:
      general.platform_name !== undefined && general.platform_name !== null
        ? String(general.platform_name)
        : "",
    organization_name:
      general.organization_name !== undefined &&
      general.organization_name !== null
        ? String(general.organization_name)
        : "",
    support_email:
      general.support_email !== undefined && general.support_email !== null
        ? String(general.support_email)
        : "",
    support_phone:
      general.support_phone !== undefined && general.support_phone !== null
        ? String(general.support_phone)
        : "",
    timezone:
      general.timezone !== undefined && general.timezone !== null
        ? String(general.timezone)
        : "",
    locale:
      general.locale !== undefined && general.locale !== null
        ? String(general.locale)
        : "",
    logo_url:
      general.logo_url !== undefined && general.logo_url !== null
        ? String(general.logo_url)
        : "",
    default_page_size:
      system.default_page_size !== undefined &&
      system.default_page_size !== null
        ? String(system.default_page_size)
        : "",
    maintenance_notice:
      system.maintenance_notice !== undefined &&
      system.maintenance_notice !== null
        ? String(system.maintenance_notice)
        : "",
  };

  return { values, meta };
}

function normalizeForComparison(values) {
  const pageSizeRaw = String(values.default_page_size ?? "").trim();
  return {
    platform_name: String(values.platform_name ?? "").trim(),
    organization_name: String(values.organization_name ?? "").trim(),
    support_email: String(values.support_email ?? "").trim().toLowerCase(),
    support_phone: String(values.support_phone ?? "").trim(),
    timezone: String(values.timezone ?? "").trim(),
    locale: String(values.locale ?? "").trim(),
    logo_url: String(values.logo_url ?? "").trim(),
    default_page_size: pageSizeRaw === "" ? NaN : Number(pageSizeRaw),
    maintenance_notice: String(values.maintenance_notice ?? "").trim(),
  };
}

function isValidTimeZone(value) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isValidLocale(value) {
  if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(value)) {
    return false;
  }
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([value]).length > 0;
  } catch {
    return false;
  }
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateSettingsForm(values) {
  const errors = {};
  const normalized = normalizeForComparison(values);

  if (
    normalized.platform_name.length < 2 ||
    normalized.platform_name.length > 120
  ) {
    errors.platform_name =
      "Platform name must be between 2 and 120 characters.";
  }

  if (
    normalized.organization_name.length < 2 ||
    normalized.organization_name.length > 160
  ) {
    errors.organization_name =
      "Organization name must be between 2 and 160 characters.";
  }

  if (normalized.support_email) {
    if (normalized.support_email.length > 255) {
      errors.support_email = "Support email cannot exceed 255 characters.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.support_email)) {
      errors.support_email = "Please provide a valid support email address.";
    }
  }

  if (normalized.support_phone) {
    if (
      normalized.support_phone.length < 7 ||
      normalized.support_phone.length > 30 ||
      !/^[+()0-9\s-]+$/.test(normalized.support_phone)
    ) {
      errors.support_phone =
        "Support phone must be 7–30 characters and contain only digits, spaces, +, -, or parentheses.";
    }
  }

  if (!normalized.timezone) {
    errors.timezone = "Timezone is required.";
  } else if (normalized.timezone.length > 80) {
    errors.timezone = "Timezone cannot exceed 80 characters.";
  } else if (!isValidTimeZone(normalized.timezone)) {
    errors.timezone = "Please provide a valid IANA timezone (e.g. UTC).";
  }

  if (normalized.locale.length < 2 || normalized.locale.length > 35) {
    errors.locale = "Locale must be between 2 and 35 characters.";
  } else if (!isValidLocale(normalized.locale)) {
    errors.locale = "Please provide a valid locale tag (e.g. en-US).";
  }

  if (normalized.logo_url) {
    if (normalized.logo_url.length > 500) {
      errors.logo_url = "Logo URL cannot exceed 500 characters.";
    } else if (!isValidHttpUrl(normalized.logo_url)) {
      errors.logo_url = "Logo URL must be a valid HTTP or HTTPS URL.";
    }
  }

  if (
    !Number.isInteger(normalized.default_page_size) ||
    normalized.default_page_size < 5 ||
    normalized.default_page_size > 100
  ) {
    errors.default_page_size =
      "Default page size must be a whole number between 5 and 100.";
  }

  if (normalized.maintenance_notice.length > 500) {
    errors.maintenance_notice =
      "Maintenance notice cannot exceed 500 characters.";
  }

  return errors;
}

function SettingsContent() {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();
  const canManageSettings =
    hasPermission(PERMISSIONS.TENANTS_MANAGE) &&
    hasAnyRole([ROLES.SUPER_ADMIN]);

  const [activeTab, setActiveTab] = useState("general");
  const [savedValues, setSavedValues] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [metadataByKey, setMetadataByKey] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const loadRequestIdRef = useRef(0);
  const saveRequestIdRef = useRef(0);

  const fetchSettings = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canManageSettings) {
      return;
    }

    const reqId = ++loadRequestIdRef.current;
    setIsLoading(true);
    setLoadError("");

    try {
      const res = await getSettingsApi();
      if (reqId !== loadRequestIdRef.current) {
        return;
      }

      const { values, meta } = extractSettingsState(res?.data);
      setSavedValues(values);
      setFormValues(values);
      setMetadataByKey(meta);
      setFieldErrors({});
      setSaveError("");
    } catch (err) {
      if (reqId !== loadRequestIdRef.current) {
        return;
      }

      if (err.status === 0) {
        setLoadError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else if (err.status === 403) {
        setLoadError(
          err.message ||
            "You do not have permission to access platform settings."
        );
      } else {
        setLoadError(err.message || "Unable to load platform settings.");
      }
    } finally {
      if (reqId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isCheckingAuth, isAuthenticated, canManageSettings]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canManageSettings) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchSettings();
    }, 0);

    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canManageSettings, fetchSettings]);

  const changedPayload = useMemo(() => {
    if (!savedValues || !formValues) {
      return {};
    }

    const base = normalizeForComparison(savedValues);
    const current = normalizeForComparison(formValues);
    const diff = {};

    for (const key of Object.keys(current)) {
      if (current[key] !== base[key]) {
        diff[key] = current[key];
      }
    }

    return diff;
  }, [savedValues, formValues]);

  const isDirty = Object.keys(changedPayload).length > 0;

  const handleFieldChange = (field) => (e) => {
    const value = e.target.value;
    setFormValues((prev) => ({ ...(prev || {}), [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (saveError) setSaveError("");
    if (saveSuccess) setSaveSuccess("");
  };

  const handleResetChanges = () => {
    if (!savedValues || isSaving) return;
    setFormValues(savedValues);
    setFieldErrors({});
    setSaveError("");
    setSaveSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (
      isSaving ||
      isLoading ||
      !formValues ||
      !savedValues ||
      !canManageSettings
    ) {
      return;
    }

    setSaveError("");
    setSaveSuccess("");

    if (!isDirty) {
      setSaveError("No unsaved changes detected.");
      return;
    }

    const errors = validateSettingsForm(formValues);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError("Please fix the highlighted fields before saving.");
      return;
    }

    const reqId = ++saveRequestIdRef.current;
    setIsSaving(true);

    try {
      const res = await updateSettingsApi(changedPayload);
      if (reqId !== saveRequestIdRef.current) {
        return;
      }

      const { values, meta } = extractSettingsState(res?.data);
      setSavedValues(values);
      setFormValues(values);
      setMetadataByKey(meta);
      setFieldErrors({});
      setSaveSuccess("Platform settings saved successfully.");
    } catch (err) {
      if (reqId !== saveRequestIdRef.current) {
        return;
      }

      const mapped = {};
      if (Array.isArray(err?.errors) && err.errors.length > 0) {
        for (const item of err.errors) {
          if (item.field && !mapped[item.field]) {
            mapped[item.field] = item.message;
          }
        }
      }
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
      }

      if (err.status === 0) {
        setSaveError(
          "Unable to reach the server. Your unsaved changes were preserved."
        );
      } else if (err.status === 403) {
        setSaveError(
          err.message ||
            "You do not have permission to update platform settings."
        );
      } else {
        setSaveError(err.message || "Failed to save platform settings.");
      }
    } finally {
      if (reqId === saveRequestIdRef.current) {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Settings
            </h1>
            {isDirty && (
              <span className="inline-flex items-center rounded-full border border-brand-soft-border bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-accent">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Manage general platform identity, localization, and system-level
            configuration.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          disabled={isLoading || isSaving}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-sm border border-border-default bg-surface px-3.5 py-2 text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover disabled:opacity-50"
        >
          <FiRefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Reload</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div
        role="tablist"
        aria-label="Settings categories"
        className="inline-flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-border-default bg-surface p-1.5 sm:w-fit"
      >
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-initial",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-text-secondary hover:bg-neutral-hover hover:text-text-primary",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="rounded-xl border border-border-default bg-surface px-6 py-12 text-center text-sm text-text-muted">
          Loading platform settings...
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-surface px-6 py-10 text-center dark:border-red-900/50"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <FiAlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">
            Unable to Load Settings
          </h2>
          <p className="mt-1 max-w-md text-sm text-red-600 dark:text-red-400">
            {loadError}
          </p>
          <Button
            type="button"
            onClick={fetchSettings}
            className="mt-4 px-5 py-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : formValues ? (
        <form onSubmit={handleSave} noValidate className="space-y-6">
          {saveSuccess && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              <span className="flex items-center gap-2">
                <FiCheckCircle className="h-4 w-4 shrink-0" />
                <span>{saveSuccess}</span>
              </span>
              <button
                type="button"
                onClick={() => setSaveSuccess("")}
                className="cursor-pointer text-emerald-700 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {saveError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
            >
              <span className="flex items-center gap-2">
                <FiAlertTriangle className="h-4 w-4 shrink-0" />
                <span>{saveError}</span>
              </span>
              <button
                type="button"
                onClick={() => setSaveError("")}
                className="cursor-pointer text-red-700 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Platform Information */}
              <section className="rounded-xl border border-border-default bg-surface p-6">
                <h2 className="text-sm font-semibold text-text-primary">
                  Platform Information
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Core platform and organization identity metadata.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="setting-platform-name"
                      className={LABEL_CLASS}
                    >
                      Platform Name
                    </label>
                    <input
                      id="setting-platform-name"
                      type="text"
                      disabled={isSaving}
                      value={formValues.platform_name}
                      onChange={handleFieldChange("platform_name")}
                      placeholder="Enter platform name"
                      className={INPUT_CLASS}
                    />
                    {metadataByKey.platform_name?.description && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        {metadataByKey.platform_name.description}
                      </p>
                    )}
                    {fieldErrors.platform_name && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.platform_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="setting-organization-name"
                      className={LABEL_CLASS}
                    >
                      Organization Name
                    </label>
                    <input
                      id="setting-organization-name"
                      type="text"
                      disabled={isSaving}
                      value={formValues.organization_name}
                      onChange={handleFieldChange("organization_name")}
                      placeholder="Enter organization name"
                      className={INPUT_CLASS}
                    />
                    {metadataByKey.organization_name?.description && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        {metadataByKey.organization_name.description}
                      </p>
                    )}
                    {fieldErrors.organization_name && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.organization_name}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="rounded-xl border border-border-default bg-surface p-6">
                <h2 className="text-sm font-semibold text-text-primary">
                  Contact Information
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Support channels displayed for administrative reference.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="setting-support-email"
                      className={LABEL_CLASS}
                    >
                      Support Email
                    </label>
                    <input
                      id="setting-support-email"
                      type="email"
                      disabled={isSaving}
                      value={formValues.support_email}
                      onChange={handleFieldChange("support_email")}
                      placeholder="support@example.com"
                      className={INPUT_CLASS}
                    />
                    {metadataByKey.support_email?.description && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        {metadataByKey.support_email.description}
                      </p>
                    )}
                    {fieldErrors.support_email && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.support_email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="setting-support-phone"
                      className={LABEL_CLASS}
                    >
                      Support Phone
                    </label>
                    <input
                      id="setting-support-phone"
                      type="text"
                      disabled={isSaving}
                      value={formValues.support_phone}
                      onChange={handleFieldChange("support_phone")}
                      placeholder="+1 (555) 000-0000"
                      className={INPUT_CLASS}
                    />
                    {metadataByKey.support_phone?.description && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        {metadataByKey.support_phone.description}
                      </p>
                    )}
                    {fieldErrors.support_phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.support_phone}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Localization & Branding */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-border-default bg-surface p-6">
                  <h2 className="text-sm font-semibold text-text-primary">
                    Localization
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Default timezone and locale formatting preferences.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="setting-timezone" className={LABEL_CLASS}>
                        Timezone
                      </label>
                      <input
                        id="setting-timezone"
                        type="text"
                        disabled={isSaving}
                        value={formValues.timezone}
                        onChange={handleFieldChange("timezone")}
                        placeholder="e.g. UTC or Asia/Kolkata"
                        className={INPUT_CLASS}
                      />
                      {metadataByKey.timezone?.description && (
                        <p className="mt-1 text-[11px] text-text-muted">
                          {metadataByKey.timezone.description}
                        </p>
                      )}
                      {fieldErrors.timezone && (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErrors.timezone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="setting-locale" className={LABEL_CLASS}>
                        Locale
                      </label>
                      <input
                        id="setting-locale"
                        type="text"
                        disabled={isSaving}
                        value={formValues.locale}
                        onChange={handleFieldChange("locale")}
                        placeholder="e.g. en-US"
                        className={INPUT_CLASS}
                      />
                      {metadataByKey.locale?.description && (
                        <p className="mt-1 text-[11px] text-text-muted">
                          {metadataByKey.locale.description}
                        </p>
                      )}
                      {fieldErrors.locale && (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErrors.locale}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-border-default bg-surface p-6">
                  <h2 className="text-sm font-semibold text-text-primary">
                    Branding
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    External HTTP or HTTPS URL for the platform logo.
                  </p>

                  <div className="mt-4">
                    <label htmlFor="setting-logo-url" className={LABEL_CLASS}>
                      Logo URL
                    </label>
                    <input
                      id="setting-logo-url"
                      type="url"
                      disabled={isSaving}
                      value={formValues.logo_url}
                      onChange={handleFieldChange("logo_url")}
                      placeholder="https://example.com/logo.png"
                      className={INPUT_CLASS}
                    />
                    {metadataByKey.logo_url?.description && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        {metadataByKey.logo_url.description}
                      </p>
                    )}
                    {fieldErrors.logo_url && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.logo_url}
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-border-default bg-surface p-6">
                <h2 className="text-sm font-semibold text-text-primary">
                  Pagination
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Configure the stored default page size preference (5–100 rows
                  per page).
                </p>

                <div className="mt-4">
                  <label
                    htmlFor="setting-default-page-size"
                    className={LABEL_CLASS}
                  >
                    Default Page Size
                  </label>
                  <input
                    id="setting-default-page-size"
                    type="number"
                    min="5"
                    max="100"
                    step="1"
                    disabled={isSaving}
                    value={formValues.default_page_size}
                    onChange={handleFieldChange("default_page_size")}
                    className={INPUT_CLASS}
                  />
                  {metadataByKey.default_page_size?.description && (
                    <p className="mt-1 text-[11px] text-text-muted">
                      {metadataByKey.default_page_size.description}
                    </p>
                  )}
                  {fieldErrors.default_page_size && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.default_page_size}
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-border-default bg-surface p-6">
                <h2 className="text-sm font-semibold text-text-primary">
                  Platform Notice
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Optional informational notice message stored in platform
                  settings (up to 500 characters; leave blank to clear).
                </p>

                <div className="mt-4">
                  <label
                    htmlFor="setting-maintenance-notice"
                    className={LABEL_CLASS}
                  >
                    Maintenance Notice
                  </label>
                  <textarea
                    id="setting-maintenance-notice"
                    rows={3}
                    disabled={isSaving}
                    value={formValues.maintenance_notice}
                    onChange={handleFieldChange("maintenance_notice")}
                    placeholder="Optional notice text..."
                    className={INPUT_CLASS}
                  />
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-text-muted">
                    <span>
                      {metadataByKey.maintenance_notice?.description ||
                        "Stored informational notice string."}
                    </span>
                    <span>{formValues.maintenance_notice.length}/500</span>
                  </div>
                  {fieldErrors.maintenance_notice && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.maintenance_notice}
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-muted">
              {isDirty
                ? `${Object.keys(changedPayload).length} ${
                    Object.keys(changedPayload).length === 1
                      ? "setting"
                      : "settings"
                  } modified and ready to save.`
                : "All settings match the latest saved configuration."}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={!isDirty || isSaving}
                onClick={handleResetChanges}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-border-default bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
              <Button
                type="submit"
                disabled={!isDirty || isSaving}
                className="px-5 py-2 text-xs"
              >
                <FiSave className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export default function SettingsPage() {
  const { isCheckingAuth, isAuthenticated, hasAnyRole } = useAuth();

  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  const isSuperAdmin = hasAnyRole([ROLES.SUPER_ADMIN]);

  const restrictedFallback = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage general platform identity, localization, and system-level
          configuration.
        </p>
      </div>
      <AccessRestricted
        title="Settings Access Restricted"
        message="Only Super Administrators with platform configuration permissions can access Admin Settings."
      />
    </div>
  );

  if (!isSuperAdmin) {
    return restrictedFallback;
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.TENANTS_MANAGE}
      fallback={restrictedFallback}
    >
      <SettingsContent />
    </PermissionGate>
  );
}
