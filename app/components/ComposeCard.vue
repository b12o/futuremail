<script setup lang="ts">
const props = defineProps<{ userEmail: string }>();

const emit = defineEmits<{ scheduled: [] }>();

const subject = ref("");
const body = ref("");
const isEncrypted = ref(false);
const preset = ref<"1h" | "1d" | "1w" | "1m" | "1y" | "custom">("1d");
const customDate = ref("");
const submitting = ref(false);
const error = ref("");
const success = ref("");

const presets = [
  { key: "1h", label: "1 HOUR" },
  { key: "1d", label: "1 DAY" },
  { key: "1w", label: "1 WEEK" },
  { key: "1m", label: "1 MONTH" },
  { key: "1y", label: "1 YEAR" },
  { key: "custom", label: "CUSTOM" },
] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const customMin = computed(() => toLocalInput(new Date(Date.now() + 60_000)));

function computeSendAt(): Date {
  const now = new Date();
  switch (preset.value) {
    case "1h":
      return new Date(now.getTime() + 3_600_000);
    case "1d":
      return new Date(now.getTime() + 86_400_000);
    case "1w":
      return new Date(now.getTime() + 7 * 86_400_000);
    case "1m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
    case "1y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    }
    case "custom":
      return new Date(customDate.value);
  }
}

let successTimer: ReturnType<typeof setTimeout> | undefined;

async function submit() {
  error.value = "";
  success.value = "";

  if (!subject.value.trim()) {
    error.value = "Subject is required";
    return;
  }
  if (!body.value.trim()) {
    error.value = "Message is required";
    return;
  }

  const sendAt = computeSendAt();
  if (Number.isNaN(sendAt.getTime()) || sendAt.getTime() <= Date.now()) {
    error.value = "Must be in the future";
    return;
  }

  submitting.value = true;
  try {
    const created = await $fetch<{ sendAt: string }>("/api/emails", {
      method: "POST",
      body: {
        subject: subject.value.trim(),
        body: body.value,
        isEncrypted: isEncrypted.value,
        sendAt: sendAt.toISOString(),
      },
    });
    success.value = `Scheduled! Arrives ${formatFullDate(created.sendAt)}`;
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      success.value = "";
    }, 6000);
    subject.value = "";
    body.value = "";
    customDate.value = "";
    emit("scheduled");
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="nb-card">
    <h2 class="font-display text-2xl uppercase mb-5">
      Create a new FutureMail
    </h2>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <div>
        <label class="nb-label mb-1.5" for="compose-to">To</label>
        <input
          id="compose-to"
          :value="truncateEmail(userEmail, 80)"
          type="email"
          class="nb-input opacity-60 select-none"
          readonly
          tabindex="-1"
          aria-readonly="true"
        />
      </div>

      <div>
        <label class="nb-label mb-1.5" for="compose-subject">Subject</label>
        <input
          id="compose-subject"
          v-model="subject"
          type="text"
          class="nb-input"
          placeholder="Hello from the past…"
        />
      </div>

      <div>
        <label class="nb-label mb-1.5" for="compose-body">Message</label>
        <textarea
          id="compose-body"
          v-model="body"
          class="nb-textarea"
          rows="6"
          placeholder="Dear future me…"
        />
      </div>

      <div>
        <span class="nb-label mb-1.5">Seal</span>
        <label
          class="inline-flex items-center gap-2 cursor-pointer select-none"
        >
          <input v-model="isEncrypted" type="checkbox" class="peer sr-only" />
          <span
            class="w-6 h-6 border-[3px] border-ink bg-white flex items-center justify-center shadow-[3px_3px_0_var(--color-ink)] transition-colors peer-checked:bg-nb-purple [&>i]:opacity-0 peer-checked:[&>i]:opacity-100"
          >
            <i class="i-lucide-lock text-sm" />
          </span>
          <span class="font-bold text-sm uppercase tracking-wide"
            >Seal contents (encrypted)</span
          >
        </label>
      </div>

      <div>
        <span class="nb-label mb-1.5">When</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in presets"
            :key="p.key"
            type="button"
            class="nb-btn !shadow-[3px_3px_0_var(--color-ink)] !py-1.5 !px-3 !text-xs"
            :class="preset === p.key ? 'nb-btn-pink' : 'nb-btn-ghost'"
            @click="preset = p.key"
          >
            {{ p.label }}
          </button>
        </div>
        <input
          v-if="preset === 'custom'"
          v-model="customDate"
          type="datetime-local"
          class="nb-input mt-2"
          :min="customMin"
        />
        <p v-if="error" class="nb-badge nb-badge-red mt-2 self-start">
          {{ error }}
        </p>
      </div>

      <p
        v-if="success"
        class="nb-sticker nb-badge-green !bg-nb-green self-start"
      >
        {{ success }}
      </p>

      <button
        type="submit"
        class="nb-btn nb-btn-pink w-full md:w-auto md:self-end"
        :disabled="submitting"
      >
        <span v-if="submitting">Scheduling…</span>
        <span v-else>Schedule it!</span>
      </button>
    </form>
  </div>
</template>
