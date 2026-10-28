"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  Check,
  Clock,
  Loader2,
  Phone,
  Search,
  Store,
  User,
} from "lucide-react";

import Modal from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import {
  createStaffAppointment,
  lookupCustomerByPhone,
} from "@/api/services/appointmentService";
import {
  browseBranchServices,
  browseBranchSlots,
} from "@/api/services/browseService";
import type { Service, StaffBookingPayload } from "@/lib/api";

interface BranchOption {
  _id: string;
  name: string;
}

interface NewBookingModalProps {
  onClose: () => void;
  onCreated: () => void;
  defaultBranchId?: string | null;
  defaultBranchName?: string | null;
  branchOptions?: BranchOption[];
  canChooseBranch?: boolean;
}

interface AvailabilitySlot {
  slotId: string;
  startTime: string;
  endTime: string;
}

interface AvailabilityGroup {
  staffId: string;
  staffName: string;
  slots: AvailabilitySlot[];
}

type LookupState = "idle" | "searching" | "found" | "none";

function todayString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function formatTime(value: string): string {
  const [hourStr, minute] = String(value || "").split(":");
  const hour = Number(hourStr);
  if (Number.isNaN(hour) || minute === undefined) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function formatMoney(paise: number): string {
  return `₹${Math.round((paise || 0) / 100).toLocaleString("en-IN")}`;
}

function serviceDuration(service: Service): number {
  return (
    (service as unknown as { durationMinutes?: number }).durationMinutes ||
    service.duration ||
    30
  );
}

export default function NewBookingModal({
  onClose,
  onCreated,
  defaultBranchId,
  defaultBranchName,
  branchOptions = [],
  canChooseBranch = false,
}: NewBookingModalProps) {
  const [branchId, setBranchId] = useState(defaultBranchId || "");
  const [date, setDate] = useState(todayString());
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [availability, setAvailability] = useState<AvailabilityGroup[]>([]);
  const [staffId, setStaffId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [source, setSource] = useState<"WALK_IN" | "PHONE">("WALK_IN");
  const [notes, setNotes] = useState("");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedCustomer, setLinkedCustomer] = useState<{
    _id: string;
    name: string;
  } | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");

  const [servicesLoading, setServicesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = useMemo(todayString, []);

  // ── Load branch services ────────────────────────────────
  useEffect(() => {
    if (!branchId) {
      setServices([]);
      setServiceId("");
      return;
    }

    let active = true;
    setServicesLoading(true);
    setServices([]);
    setServiceId("");
    setAvailability([]);
    setStaffId("");
    setSlotId("");

    browseBranchServices(branchId)
      .then((res) => {
        if (!active) return;
        const payload = res.data as unknown as {
          services?: Service[];
        };
        const list = Array.isArray(payload) ? payload : payload?.services || [];
        setServices(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setServices([]);
      })
      .finally(() => {
        if (active) setServicesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [branchId]);

  // ── Load free slots for the chosen date + service ──────
  useEffect(() => {
    if (!branchId || !date || !serviceId) {
      setAvailability([]);
      setStaffId("");
      setSlotId("");
      return;
    }

    let active = true;
    setSlotsLoading(true);
    setAvailability([]);
    setStaffId("");
    setSlotId("");

    browseBranchSlots(branchId, date, { serviceId })
      .then((res) => {
        if (!active) return;
        const payload = res.data as unknown as {
          availability?: AvailabilityGroup[];
        };
        const groups = Array.isArray(payload?.availability)
          ? payload.availability
          : [];
        setAvailability(groups);
      })
      .catch(() => {
        if (active) setAvailability([]);
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [branchId, date, serviceId]);

  const selectedService = services.find((s) => s._id === serviceId) || null;
  const staffGroup = availability.find((g) => g.staffId === staffId) || null;

  const changePhone = (value: string) => {
    setPhone(value);
    if (linkedCustomer) {
      setLinkedCustomer(null);
      setLookupState("idle");
    } else if (lookupState !== "idle") {
      setLookupState("idle");
    }
  };

  const checkCustomer = useCallback(async () => {
    const digits = digitsOnly(phone);
    if (digits.length < 10) {
      setLinkedCustomer(null);
      setLookupState("idle");
      return;
    }

    setLookupState("searching");
    try {
      const res = await lookupCustomerByPhone(phone);
      const customer = (res.data as unknown as { customer?: { _id: string; name: string } | null })
        ?.customer;
      if (customer) {
        setLinkedCustomer(customer);
        setLookupState("found");
        setName(customer.name);
      } else {
        setLinkedCustomer(null);
        setLookupState("none");
      }
    } catch {
      setLinkedCustomer(null);
      setLookupState("none");
    }
  }, [phone]);

  const phoneDigits = digitsOnly(phone);
  const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const customerReady = linkedCustomer
    ? true
    : name.trim().length > 0 && phoneDigits.length >= 10 && phoneDigits.length <= 15;
  const isValid =
    Boolean(branchId && date && serviceId && staffId && slotId) &&
    customerReady &&
    emailValid &&
    !submitting;

  async function handleSubmit() {
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: StaffBookingPayload = {
        branchId,
        slotId,
        serviceId,
        staffId,
        source,
        customerNotes: notes.trim() || undefined,
        ...(linkedCustomer
          ? { customerId: linkedCustomer._id }
          : {
              customer: {
                name: name.trim(),
                phone: phone.trim(),
                ...(email.trim() ? { email: email.trim() } : {}),
              },
            }),
      };

      await createStaffAppointment(payload);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Could not create the booking. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const branchName =
    branchOptions.find((b) => b._id === branchId)?.name ||
    (branchId === defaultBranchId ? defaultBranchName : null);

  return (
    <Modal title="New Booking" onClose={onClose} width="max-w-3xl">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3 text-xs font-medium">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* ── Appointment details ─────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={14} />
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Appointment
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {canChooseBranch && branchOptions.length > 0 ? (
              <Select
                label="Branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                options={[
                  { value: "", label: "Select a branch" },
                  ...branchOptions.map((b) => ({ value: b._id, label: b.name })),
                ]}
              />
            ) : (
              <Input
                label="Branch"
                value={branchName || "Your assigned branch"}
                readOnly
                disabled
              />
            )}

            <Input
              label="Date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlotId("");
              }}
            />

            <Select
              label="Service"
              value={serviceId}
              disabled={!branchId || servicesLoading}
              onChange={(e) => {
                setServiceId(e.target.value);
                setSlotId("");
              }}
              options={[
                {
                  value: "",
                  label: servicesLoading
                    ? "Loading services..."
                    : "Select a service",
                },
                ...services.map((s) => ({
                  value: s._id,
                  label: `${s.name} — ${formatMoney(s.price)} (${serviceDuration(s)} min)`,
                })),
              ]}
            />

            <Select
              label="Staff"
              value={staffId}
              disabled={!serviceId || slotsLoading || availability.length === 0}
              onChange={(e) => {
                setStaffId(e.target.value);
                setSlotId("");
              }}
              options={[
                {
                  value: "",
                  label: !serviceId
                    ? "Pick a service first"
                    : slotsLoading
                      ? "Checking availability..."
                      : availability.length === 0
                        ? "No staff available"
                        : "Select a staff member",
                },
                ...availability.map((g) => ({
                  value: g.staffId,
                  label: `${g.staffName} (${g.slots.length} slot${g.slots.length === 1 ? "" : "s"})`,
                })),
              ]}
            />
          </div>

          {/* Time slots */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-medium text-slate">
                Time slot
              </label>
              {selectedService && (
                <span className="text-[11px] font-medium text-slate-400">
                  {serviceDuration(selectedService)} min •{" "}
                  {formatMoney(selectedService.price)}
                </span>
              )}
            </div>

            {slotsLoading ? (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-3">
                <Loader2 size={14} className="animate-spin" />
                Checking availability...
              </div>
            ) : !serviceId ? (
              <div className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-3">
                Select a service to see free slots.
              </div>
            ) : !staffId ? (
              <div className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-3">
                {availability.length > 0
                  ? "Select a staff member to see their free slots."
                  : "No free slots on this date. Try another day."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(staffGroup?.slots || []).map((slot) => {
                  const active = slotId === slot.slotId;
                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      onClick={() => setSlotId(slot.slotId)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[11px] font-bold transition-all ${
                        active
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Clock size={12} className={active ? "text-white" : "text-slate-400"} />
                      {formatTime(slot.startTime)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Booking source */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-slate">Source</span>
            {(
              [
                { value: "WALK_IN", label: "Walk-in", icon: Store },
                { value: "PHONE", label: "Phone", icon: Phone },
              ] as const
            ).map((option) => {
              const Icon = option.icon;
              const active = source === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSource(option.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                    active
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={12} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Customer ────────────────────────────────── */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <User size={14} />
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Customer
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => changePhone(e.target.value)}
                  onBlur={checkCustomer}
                />
              </div>
              <button
                type="button"
                onClick={checkCustomer}
                disabled={lookupState === "searching" || phoneDigits.length < 10}
                className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {lookupState === "searching" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Search size={13} />
                )}
                Find
              </button>
            </div>

            {!linkedCustomer && (
              <Input
                label="Full name"
                placeholder="Customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </div>

          {lookupState === "found" && linkedCustomer ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <BadgeCheck size={17} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    Existing customer: {linkedCustomer.name}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-700/80">
                    This booking will be linked to their account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLinkedCustomer(null);
                  setLookupState("idle");
                }}
                className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900"
              >
                Book as guest instead
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Email (optional)"
                type="email"
                placeholder="customer@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={
                  email.trim() && !emailValid ? "Enter a valid email address" : undefined
                }
              />
              <div className="flex items-end">
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                  {lookupState === "none"
                    ? "No app account matched this number — the booking will be saved as a guest."
                    : "Guest bookings don't need an app account. Their name and phone are stored on the appointment."}
                </p>
              </div>
            </div>
          )}

          <div className="mt-3.5">
            <Textarea
              label="Notes (optional)"
              placeholder="Any preferences or special requests..."
              rows={2}
              maxLength={300}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {submitting ? "Creating..." : "Create booking"}
        </button>
      </div>
    </Modal>
  );
}
