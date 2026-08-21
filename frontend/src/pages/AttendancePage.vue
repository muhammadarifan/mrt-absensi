<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { api } from "../lib/api";

const today = new Date().toISOString().slice(0, 10);

const { data: attendance, isLoading, error } = useQuery({
  queryKey: ["attendance", today],
  queryFn: () => api.getAttendance(today),
});
</script>

<template>
  <h1>Absensi Hari Ini ({{ today }})</h1>
  <p v-if="isLoading">Loading...</p>
  <p v-else-if="error">Gagal memuat data.</p>
  <table v-else>
    <thead>
      <tr>
        <th>Nama</th>
        <th>Jam Scan</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in attendance" :key="row.attendance.id">
        <td>{{ row.students.name }}</td>
        <td>{{ row.attendance.scannedAt }}</td>
        <td>{{ row.attendance.status }}</td>
      </tr>
    </tbody>
  </table>
</template>
