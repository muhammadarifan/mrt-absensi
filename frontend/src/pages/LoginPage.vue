<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../lib/api";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const router = useRouter();

async function onSubmit() {
  error.value = "";
  loading.value = true;
  try {
    const { token, user } = await api.login(email.value, password.value);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    router.push("/");
  } catch {
    error.value = "Email atau password salah";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="login" @submit.prevent="onSubmit">
    <h1>Login</h1>
    <label>
      Email
      <input v-model="email" type="email" required autofocus />
    </label>
    <label>
      Password
      <input v-model="password" type="password" required />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <button type="submit" :disabled="loading">{{ loading ? "Loading..." : "Login" }}</button>
  </form>
</template>

<style scoped>
.login {
  max-width: 320px;
  margin: 4rem auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 32px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.login h1 {
  margin: 0;
}
.error {
  color: var(--danger);
  font-size: 13px;
  margin: -6px 0 0;
}
</style>
