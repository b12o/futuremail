<script setup lang="ts">
import type { ScheduledEmail } from "~/types/email";

const props = defineProps<{ email: ScheduledEmail }>();
const emit = defineEmits<{ departed: [] }>();

const now = useNow();

const remainingMs = computed(
  () => new Date(props.email.sendAt).getTime() - now.value,
);

const countdownText = computed(() => {
  const ms = remainingMs.value;
  if (ms <= 0) return "ARRIVES IN 0 SECONDS";
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `ARRIVES IN ${days} ${days === 1 ? "DAY" : "DAYS"}`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1)
    return `ARRIVES IN ${hours} ${hours === 1 ? "HOUR" : "HOURS"}`;
  const minutes = Math.floor(ms / 60_000);
  if (minutes >= 1)
    return `ARRIVES IN ${minutes} ${minutes === 1 ? "MINUTE" : "MINUTES"}`;
  const seconds = Math.ceil(ms / 1000);
  return `ARRIVES IN ${seconds} ${seconds === 1 ? "SECOND" : "SECONDS"}`;
});

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
  <div class="nb-card !p-3">
    <div class="flex items-center flex-wrap gap-2 mb-2">
      <p class="font-display text-lg" :class="{ 'nb-pulse': remainingMs <= 0 }">
        {{ countdownText }}
      </p>
      <span v-if="email.isEncrypted" class="nb-badge nb-badge-purple ml-auto">
        <UIcon name="i-lucide-lock" class="size-3" /> SEALED
      </span>
      <span
        class="nb-badge"
        :class="
          email.status === 'sending'
            ? 'nb-badge-cyan nb-pulse'
            : 'nb-badge-yellow'
        "
      >
        {{ email.status === "sending" ? "SENDING NOW" : "IN TRANSIT" }}
      </span>
    </div>

    <div class="nb-track mb-1.5">
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
