<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { api } from "../lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const { data: students, isLoading } = useQuery({
  queryKey: ["students"],
  queryFn: api.getStudents,
});
</script>

<template>
  <main class="page">
    <h1>Data Siswa</h1>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Kelas</TableHead>
          <TableHead>UID Kartu</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="isLoading" :colspan="3">Loading...</TableEmpty>
        <TableEmpty v-else-if="!students?.length" :colspan="3">Belum ada data siswa.</TableEmpty>
        <TableRow v-for="s in students" v-else :key="s.id">
          <TableCell>{{ s.name }}</TableCell>
          <TableCell>{{ s.classId }}</TableCell>
          <TableCell>{{ s.cardUid ?? "-" }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </main>
</template>
