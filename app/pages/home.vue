<script setup lang="ts">
const value = ref("");
</script>

<template>
  <section class="border border-red-100 p-8">
    <div class="w-full flex">
      <UTextarea placeholder="Dear future self..." :rows="12" />
    </div>
  </section>
  <section>
    <UButton variant="outline" class="mr-3">1 hour</UButton>
    <UButton variant="outline" class="mr-3">1 day</UButton>
    <UButton variant="outline" class="mr-3">1 year</UButton>
    <UButton variant="outline" class="mr-3">Set date</UButton>
    <UButton variant="soft">Send</UButton>
  </section>
</template>
