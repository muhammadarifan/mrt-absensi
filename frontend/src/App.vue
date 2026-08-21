<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

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
    <button @click="logout">Logout</button>
  </nav>
  <router-view />
</template>
