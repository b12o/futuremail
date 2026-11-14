<script setup lang="ts">
import type { ScheduledEmail } from "~/types/email";

const props = defineProps<{ email: ScheduledEmail }>();
const emit = defineEmits<{ departed: [] }>();

const now = useNow();

const remainingMs = computed(
  () => new Date(props.email.sendAt).getTime() - now.value,
);

const countdownText = computed(() => {
  if (remainingMs.value <= 5000) return "ALMOST THERE…";
  else return `ARRIVES IN ${countdown.value}`;
});

const countdown = computed(() => {
  const total = Math.floor(remainingMs.value / 1000);
  const d = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3_600);
  const m = Math.floor((total % 3_600) / 60);
  const s = total % 60;
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return d > 0 ? `${pad(d)}d ${clock}` : clock;
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const progress = computed(() => {
  const start = new Date(props.email.createdAt).getTime();
  const end = new Date(props.email.sendAt).getTime();
  if (end <= start) return 100;
  return Math.min(
    100,
    Math.max(0, ((now.value - start) / (end - start)) * 100),
  );
});

let hasDeparted = remainingMs.value <= 0;

watch(remainingMs, (value) => {
  if (value <= 0 && !hasDeparted) {
    hasDeparted = true;
    emit("departed");
  }
});
</script>

<template>
  <div class="nb-card !p-4">
    <div class="flex items-center flex-wrap gap-2 mb-3">
      <span v-if="email.isEncrypted" class="nb-badge nb-badge-purple">
        <UIcon name="i-lucide-lock" class="size-3" /> SEALED
      </span>
      <span
        class="nb-badge ml-auto"
        :class="
          email.status === 'sending'
            ? 'nb-badge-cyan nb-pulse'
            : 'nb-badge-yellow'
        "
      >
        {{ email.status === "sending" ? "SENDING NOW" : "IN TRANSIT" }}
      </span>
    </div>

    <p
      class="font-display text-2xl mb-3"
      :class="{ 'nb-pulse': remainingMs <= 0 }"
    >
      {{ countdownText }}
    </p>

    <div class="nb-track mb-2">
      <span class="nb-track-line" />
      <span class="nb-plane-marker" :style="{ left: `${progress}%` }">
        <UIcon name="i-lucide-send-horizontal" class="size-4" />
      </span>
    </div>

    <div
      class="flex justify-between text-[0.65rem] font-bold uppercase tracking-wider opacity-80"
    >
      <span>Departed {{ formatShortDate(email.createdAt) }}</span>
      <span>Arrives {{ formatShortDate(email.sendAt) }}</span>
    </div>
  </div>
</template>
