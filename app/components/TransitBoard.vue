<script setup lang="ts">
import type { ScheduledEmail } from "~/types/email";

const { data, refresh } = useFetch<ScheduledEmail[]>("/api/emails", {
  default: () => [] as ScheduledEmail[],
});

const POLL_INTERVAL_MS = 5_000;

let pollTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  pollTimer = setInterval(() => {
    refresh();
  }, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

const rows = computed(() => data.value ?? []);

const inTransit = computed(() =>
  rows.value
    .filter((r) => r.status === "pending" || r.status === "sending")
    .sort(
      (a, b) => new Date(a.sendAt).getTime() - new Date(b.sendAt).getTime(),
    ),
);

const delivered = computed(() =>
  rows.value.filter((r) => r.status === "delivered"),
);

const failed = computed(() => rows.value.filter((r) => r.status === "failed"));

defineExpose({ refresh });
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <h2 class="font-display text-2xl uppercase">In transit</h2>
      <span class="nb-badge nb-badge-yellow">{{ inTransit.length }}</span>
    </div>

    <div v-if="inTransit.length === 0" class="nb-card nb-card-dashed text-center py-10">
      <p class="font-display text-lg uppercase mb-1">🕳 The time pipeline is empty</p>
      <p class="text-sm opacity-70">Send your first capsule →</p>
    </div>

    <TransitCard
      v-for="email in inTransit"
      :key="email.id"
      :email
      @departed="refresh()"
    />

    <template v-if="delivered.length > 0">
      <div class="nb-divider my-2" />
      <div class="flex items-center gap-3">
        <h3 class="font-display text-lg uppercase">Delivered</h3>
        <span class="nb-badge nb-badge-green">{{ delivered.length }}</span>
      </div>
      <div class="flex flex-col gap-2">
        <div
          v-for="email in delivered"
          :key="email.id"
          class="nb-card !shadow-[3px_3px_0_var(--color-ink)] !p-3 flex items-center gap-3 flex-wrap"
        >
          <span class="nb-badge nb-badge-green">DELIVERED</span>
          <span class="font-bold text-sm truncate">{{ email.subject ?? "(no subject)" }}</span>
          <span class="text-xs opacity-60 truncate">→ {{ email.recipientEmail }}</span>
          <span class="ml-auto text-xs font-bold whitespace-nowrap">
            {{ formatFullDate(email.sendAt) }}
          </span>
        </div>
      </div>
    </template>

    <template v-if="failed.length > 0">
      <div class="nb-divider my-2" />
      <div class="flex items-center gap-3">
        <h3 class="font-display text-lg uppercase">Failed</h3>
        <span class="nb-badge nb-badge-red">{{ failed.length }}</span>
      </div>
      <div class="flex flex-col gap-2">
        <div
          v-for="email in failed"
          :key="email.id"
          class="nb-card !shadow-[3px_3px_0_var(--color-ink)] !p-3 flex items-center gap-3 flex-wrap"
        >
          <span class="nb-badge nb-badge-red">FAILED</span>
          <span class="font-bold text-sm truncate">{{ email.subject ?? "(no subject)" }}</span>
          <span class="ml-auto text-xs font-bold whitespace-nowrap">
            attempts: {{ email.attempts }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
