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
  gap: 0.75rem;
}
.error {
  color: #d33;
}
</style>
