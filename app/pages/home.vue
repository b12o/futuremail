<script setup lang="ts">
const value = ref("");
</script>

<template>
  <div class="flex">
    <TheSidebar />
    <div class="flex border border-red-100">
      <UTextarea placeholder="Dear future self..." :rows="12" />
    </div>
    <div>
      <UButton variant="soft">Send</UButton>
    </div>
  </div>
</template>
