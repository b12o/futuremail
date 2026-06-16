<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Docs",
    to: "https:google.com",
    target: "_blank",
  },
]);
</script>

<template>
  <UHeader title="FutureMail">
    <template>
      <UNavigationMenu :items="items" />
    </template>

    <template #right>
      <UColorModeButton />
      <UButton variant="ghost" label="Login" />
      <UButton variant="solid" label="Sign Up" />
    </template>
  </UHeader>
</template>
