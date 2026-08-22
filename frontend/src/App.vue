<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Button } from "@/components/ui/button";

const router = useRouter();
const route = useRoute();
const loggedIn = computed(() => route.path !== "/login");

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
}
</script>

<template>
  <nav v-if="loggedIn">
    <router-link to="/">Absensi</router-link>
    |
    <router-link to="/students">Siswa</router-link>
    |
    <router-link to="/classes">Kelas</router-link>
    |
    <router-link to="/devices">Perangkat</router-link>
    |
    <Button class="bg-[var(--brand)] text-white hover:opacity-90" @click="logout">Logout</Button>
  </nav>
  <router-view />
</template>
