<script setup lang="ts">
const value = ref("");
</script>

<template>
  <div class="flex h-screen">
    <div class="w-64 shrink-0">
      <TheSidebar />
    </div>
    <div class="flex-1 flex flex-col gap-4 p-6">
      <UTextarea
        v-model="value"
        placeholder="Dear future self..."
        :rows="12"
        class="w-full flex-1"
        :ui="{ base: 'resize-none' }"
      />
      <div class="flex justify-end">
        <UButton variant="soft">Send</UButton>
      </div>
    </div>
  </div>
</template>

