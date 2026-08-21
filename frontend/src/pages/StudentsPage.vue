<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { api } from "../lib/api";

const { data: students, isLoading } = useQuery({
  queryKey: ["students"],
  queryFn: api.getStudents,
});
</script>

<template>
  <h1>Data Siswa</h1>
  <p v-if="isLoading">Loading...</p>
  <table v-else>
    <thead>
      <tr>
        <th>Nama</th>
        <th>Kelas</th>
        <th>UID Kartu</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="s in students" :key="s.id">
        <td>{{ s.name }}</td>
        <td>{{ s.classId }}</td>
        <td>{{ s.cardUid ?? "-" }}</td>
      </tr>
    </tbody>
  </table>
</template>
