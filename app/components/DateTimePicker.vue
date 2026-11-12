<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });
const value = defineModel<string>({ default: "" });

const emit = defineEmits<{ confirm: [value: string] }>();

// Deliberately not `useNow()`: a ticking clock re-rendered the dialog every
// second, which made the open dropdown popups flicker. Validity is refreshed on
// every interaction instead (plus a hard check on confirm).
const nowMs = ref(Date.now());

function refreshNow() {
  nowMs.value = Date.now();
}

const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => i * 30);
const YEAR_SPAN = 10;

const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());
const selectedDay = ref(new Date().getDate());
const slot = ref(0);

const dialogEl = ref<HTMLElement | null>(null);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatSlot(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function roundToSlot(d: Date) {
  const minutes = Math.round((d.getHours() * 60 + d.getMinutes()) / 30) * 30;
  return minutes >= 24 * 60 ? 0 : minutes;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function parseLocal(input: string): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function defaultDraft() {
  return new Date(Date.now() + 86_400_000);
}

function syncDraft() {
  const base = parseLocal(value.value) ?? defaultDraft();
  viewYear.value = base.getFullYear();
  viewMonth.value = base.getMonth();
  selectedDay.value = base.getDate();
  slot.value = roundToSlot(base);
}

const draft = computed(
  () =>
    new Date(
      viewYear.value,
      viewMonth.value,
      selectedDay.value,
      Math.floor(slot.value / 60),
      slot.value % 60,
      0,
      0,
    ),
);

const invalid = computed(() => draft.value.getTime() <= nowMs.value);

const leadingBlanks = computed(
  () => (new Date(viewYear.value, viewMonth.value, 1).getDay() + 6) % 7,
);

const days = computed(() =>
  Array.from(
    { length: daysInMonth(viewYear.value, viewMonth.value) },
    (_, i) => i + 1,
  ),
);

// Always six week rows, so switching between short and long months never
// changes the modal height.
const calendarCells = computed<(number | null)[]>(() => {
  const cells: (number | null)[] = Array(leadingBlanks.value).fill(null);
  for (const day of days.value) cells.push(day);
  while (cells.length < 42) cells.push(null);
  return cells;
});

const canGoPrev = computed(
  () =>
    new Date(viewYear.value, viewMonth.value, 0, 23, 59, 59, 999).getTime() >
    nowMs.value,
);

function clampSelectedDay() {
  selectedDay.value = Math.min(
    selectedDay.value,
    daysInMonth(viewYear.value, viewMonth.value),
  );
}

function onPeriodChange() {
  refreshNow();
  clampSelectedDay();
}

function shiftMonth(delta: number) {
  refreshNow();
  const target = new Date(viewYear.value, viewMonth.value + delta, 1);
  viewYear.value = target.getFullYear();
  viewMonth.value = target.getMonth();
  clampSelectedDay();
}

function isPastDay(day: number) {
  return (
    new Date(viewYear.value, viewMonth.value, day, 23, 59, 59, 999).getTime() <=
    nowMs.value
  );
}

function isPastSlot(minutes: number) {
  return (
    new Date(
      viewYear.value,
      viewMonth.value,
      selectedDay.value,
      Math.floor(minutes / 60),
      minutes % 60,
      0,
      0,
    ).getTime() <= nowMs.value
  );
}

function selectDay(day: number) {
  refreshNow();
  selectedDay.value = day;
  if (!isPastSlot(slot.value)) return;
  const nextSlot = TIME_SLOTS.find((minutes) => !isPastSlot(minutes));
  if (nextSlot !== undefined) slot.value = nextSlot;
}

const monthOptions = computed(() =>
  MONTHS.map((label, index) => ({ value: index, label })),
);

const yearOptions = computed(() => {
  const baseYear = new Date(nowMs.value).getFullYear();
  const years: number[] = [];
  for (let y = baseYear; y <= baseYear + YEAR_SPAN; y++) years.push(y);
  if (!years.includes(viewYear.value)) {
    years.push(viewYear.value);
    years.sort((a, b) => a - b);
  }
  return years.map((year) => ({ value: year, label: String(year) }));
});

const timeOptions = computed(() =>
  TIME_SLOTS.map((minutes) => ({
    value: minutes,
    label: formatSlot(minutes),
    disabled: isPastSlot(minutes),
  })),
);

function isToday(day: number) {
  const today = new Date(nowMs.value);
  return (
    today.getFullYear() === viewYear.value &&
    today.getMonth() === viewMonth.value &&
    today.getDate() === day
  );
}

function confirm() {
  refreshNow();
  if (invalid.value) return;
  const result = `${viewYear.value}-${pad(viewMonth.value + 1)}-${pad(selectedDay.value)}T${formatSlot(slot.value)}`;
  value.value = result;
  emit("confirm", result);
  open.value = false;
}

function cancel() {
  open.value = false;
}

function focusables(): HTMLElement[] {
  const root = dialogEl.value;
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  if (event.key === "Escape") {
    event.preventDefault();
    cancel();
    return;
  }
  if (event.key !== "Tab") return;

  const items = focusables();
  if (items.length === 0) return;

  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;

  const active = document.activeElement as HTMLElement | null;

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  } else if (
    event.shiftKey &&
    (active === first || !dialogEl.value?.contains(active))
  ) {
    event.preventDefault();
    last.focus();
  }
}

let previousOverflow = "";
let restoreFocus: HTMLElement | null = null;

watch(open, (isOpen) => {
  if (!import.meta.client) return;

  if (isOpen) {
    refreshNow();
    syncDraft();
    restoreFocus = document.activeElement as HTMLElement | null;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeydown);
    nextTick(() => dialogEl.value?.focus());
    return;
  }

  document.body.style.overflow = previousOverflow;
  window.removeEventListener("keydown", onKeydown);
  restoreFocus?.focus();
  restoreFocus = null;
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.body.style.overflow = previousOverflow;
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="nb-modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/75"
        @mousedown.self="cancel"
      >
        <div
          ref="dialogEl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nb-dtp-title"
          tabindex="-1"
          class="nb-modal-panel w-full max-w-sm bg-white border-[3px] border-ink shadow-[8px_8px_0_var(--color-ink)] outline-none"
        >
          <div class="border-b-[3px] border-ink bg-nb-yellow px-3 py-2.5">
            <h2
              id="nb-dtp-title"
              class="font-display text-base uppercase tracking-tight"
            >
              Pick a moment in the future
            </h2>
          </div>

          <div class="p-3">
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="nb-btn nb-btn-ghost !p-0 w-8 h-8 shrink-0"
                aria-label="Previous month"
                :disabled="!canGoPrev"
                @click="shiftMonth(-1)"
              >
                <span class="text-base font-bold leading-none">←</span>
              </button>

              <div class="flex-1 min-w-0">
                <PickerListbox
                  v-model="viewMonth"
                  :options="monthOptions"
                  label="Month"
                  panel-class="max-h-60"
                  trigger-class="!text-xs font-bold uppercase"
                  @update:model-value="onPeriodChange"
                />
              </div>

              <PickerListbox
                v-model="viewYear"
                :options="yearOptions"
                label="Year"
                panel-class="max-h-60"
                trigger-class="!text-xs font-bold"
                @update:model-value="onPeriodChange"
              />

              <button
                type="button"
                class="nb-btn nb-btn-ghost !p-0 w-8 h-8 shrink-0"
                aria-label="Next month"
                @click="shiftMonth(1)"
              >
                <span class="text-base font-bold leading-none">→</span>
              </button>
            </div>

            <div class="grid grid-cols-7 gap-1 mt-3 mb-1">
              <span
                v-for="weekday in WEEKDAYS"
                :key="weekday"
                class="text-center text-[0.6rem] font-bold tracking-widest opacity-50"
              >
                {{ weekday }}
              </span>
            </div>

            <div class="grid grid-cols-7 auto-rows-[2.2rem] gap-1">
              <template v-for="(day, index) in calendarCells" :key="index">
                <span v-if="day === null" />
                <button
                  v-else
                  type="button"
                  class="nb-cal-day"
                  :class="{
                    'nb-cal-day-today': isToday(day),
                    'nb-cal-day-selected': day === selectedDay,
                  }"
                  :disabled="isPastDay(day)"
                  :aria-pressed="day === selectedDay"
                  @click="selectDay(day)"
                >
                  {{ day }}
                </button>
              </template>
            </div>

            <div class="nb-divider my-3" />

            <div class="flex items-center gap-2">
              <span class="nb-label">Time</span>

              <div class="w-32">
                <PickerListbox
                  v-model="slot"
                  :options="timeOptions"
                  label="Time"
                  direction="up"
                  panel-class="max-h-60"
                  trigger-class="font-display !text-sm"
                  @update:model-value="refreshNow"
                />
              </div>

              <span
                class="ml-auto text-[0.65rem] uppercase tracking-wide opacity-50"
                >Local time</span
              >
            </div>

            <div class="h-7 mt-2 flex items-center">
              <p v-if="invalid" class="nb-badge nb-badge-red">
                Must be in the future
              </p>
            </div>
          </div>

          <div
            class="flex items-center justify-end gap-2 border-t-[3px] border-ink px-3 py-3"
          >
            <button
              type="button"
              class="nb-btn nb-btn-ghost !py-1.5 !px-3 !text-xs"
              @click="cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              class="nb-btn nb-btn-pink !py-1.5 !px-3 !text-xs"
              :disabled="invalid"
              @click="confirm"
            >
              Set date
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
