<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { api } from "../lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const today = new Date().toISOString().slice(0, 10);

const { data: attendance, isLoading, error } = useQuery({
  queryKey: ["attendance", today],
  queryFn: () => api.getAttendance(today),
});
</script>

<template>
  <main class="page">
    <h1>Absensi Hari Ini ({{ today }})</h1>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Jam Scan</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="isLoading" :colspan="3">Loading...</TableEmpty>
        <TableEmpty v-else-if="error" :colspan="3">Gagal memuat data.</TableEmpty>
        <TableEmpty v-else-if="!attendance?.length" :colspan="3">Belum ada yang absen hari ini.</TableEmpty>
        <TableRow v-for="row in attendance" v-else :key="row.attendance.id">
          <TableCell>{{ row.students.name }}</TableCell>
          <TableCell>{{ row.attendance.scannedAt }}</TableCell>
          <TableCell>
            <Badge
              :class="row.attendance.status === 'hadir'
                ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                : 'bg-[var(--late-bg)] text-[var(--late-text)]'"
            >
              {{ row.attendance.status }}
            </Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </main>
</template>
