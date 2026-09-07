<script setup lang="ts">
import type { ScheduledEmail } from "~/types/email"

const props = defineProps<{ email: ScheduledEmail }>()

const now = useNow()

const remainingMs = computed(() => new Date(props.email.sendAt).getTime() - now.value)

const countdown = computed(() => {
  if (remainingMs.value <= 0) return "ARRIVING…"
  const total = Math.floor(remainingMs.value / 1000)
  const d = Math.floor(total / 86_400)
  const h = Math.floor((total % 86_400) / 3_600)
  const m = Math.floor((total % 3_600) / 60)
  const s = total % 60
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`
  return d > 0 ? `${pad(d)}d ${clock}` : clock
})

function pad(n: number) {
  return String(n).padStart(2, "0")
}

const progress = computed(() => {
  const start = new Date(props.email.createdAt).getTime()
  const end = new Date(props.email.sendAt).getTime()
  if (end <= start) return 100
  return Math.min(100, Math.max(0, ((now.value - start) / (end - start)) * 100))
})
</script>

<template>
  <div class="nb-card !p-4">
    <div class="flex items-center flex-wrap gap-2 mb-3">
      <span class="font-bold text-sm truncate">✉ TO {{ email.recipientEmail }}</span>
      <span v-if="email.isEncrypted" class="nb-badge nb-badge-purple">
        <i class="i-lucide-lock text-xs" /> SEALED
      </span>
      <span
        class="nb-badge ml-auto"
        :class="email.status === 'sending' ? 'nb-badge-cyan nb-pulse' : 'nb-badge-yellow'"
      >
        {{ email.status === "sending" ? "SENDING NOW" : "IN TRANSIT" }}
      </span>
    </div>

    <p class="font-display text-2xl mb-3" :class="{ 'nb-pulse': remainingMs <= 0 }">
      ARRIVES IN {{ countdown }}
    </p>

    <div class="nb-track mb-1">
      <span class="nb-track-line" />
      <span class="nb-track-fill" :style="{ width: `${progress}%` }" />
      <span class="nb-mail-marker" :style="{ left: `${progress}%` }">
        <i class="i-lucide-mail text-xs" />
      </span>
    </div>

    <div class="flex justify-between text-[0.65rem] font-bold uppercase tracking-wider mb-2 opacity-80">
      <span>Departed {{ formatShortDate(email.createdAt) }}</span>
      <span>Arrives {{ formatShortDate(email.sendAt) }}</span>
    </div>

    <p class="text-xs opacity-60">{{ formatFullDate(email.sendAt) }}</p>
  </div>
</template>
