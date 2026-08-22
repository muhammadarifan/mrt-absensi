<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { api } from "../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
const queryClient = useQueryClient();

const { data: attendance, isLoading, error } = useQuery({
  queryKey: ["attendance", today],
  queryFn: () => api.getAttendance(today),
});

const deleteMutation = useMutation({
  mutationFn: (id: number) => api.deleteAttendance(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", today] }),
});

function onDelete(row: any) {
  if (confirm(`Hapus absensi "${row.students.name}"?`)) deleteMutation.mutate(row.attendance.id);
}
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
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="isLoading" :colspan="4">Loading...</TableEmpty>
        <TableEmpty v-else-if="error" :colspan="4">Gagal memuat data.</TableEmpty>
        <TableEmpty v-else-if="!attendance?.length" :colspan="4">Belum ada yang absen hari ini.</TableEmpty>
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
          <TableCell>
            <Button variant="destructive" size="sm" @click="onDelete(row)">Hapus</Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </main>
</template>
