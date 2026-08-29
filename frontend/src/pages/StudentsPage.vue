<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  createSortedRowModel,
  FlexRender,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/vue-table";
import { computed, h, onUnmounted, ref, watch } from "vue";
import { api, type Student, type StudentInput } from "../lib/api";

const queryClient = useQueryClient();

const { data: attendanceCode } = useQuery({
  queryKey: ["attendance-code"],
  queryFn: api.getAttendanceCode,
});

const generateCodeMutation = useMutation({
  mutationFn: api.generateAttendanceCode,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance-code"] }),
});

const { data: students, isLoading } = useQuery({
  queryKey: ["students"],
  queryFn: api.getStudents,
});

const { data: classes } = useQuery({
  queryKey: ["classes"],
  queryFn: api.getClasses,
});

const { data: devices } = useQuery({
  queryKey: ["devices"],
  queryFn: api.getDevices,
});

const classNameById = computed(() => {
  const map = new Map<number, string>();
  for (const c of classes.value ?? []) map.set(c.id, c.name);
  return map;
});

const dialogOpen = ref(false);
const editingId = ref<number | null>(null);
const form = ref<{ name: string; classId: string; cardUid: string }>({ name: "", classId: "", cardUid: "" });
const formError = ref("");

const scanning = ref(false);
const scanError = ref("");
let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopScan() {
  scanning.value = false;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

async function startScan() {
  const device = devices.value?.[0];
  if (!device) {
    scanError.value = "Belum ada device RFID terdaftar. Tambah dulu di halaman Devices.";
    return;
  }
  scanError.value = "";
  scanning.value = true;
  pollTimer = setInterval(async () => {
    try {
      const res = await api.getPendingScan(device.id);
      if (res.cardUid) {
        form.value.cardUid = res.cardUid;
        stopScan();
        await api.clearPendingScan(device.id);
      }
    } catch {

    }
  }, 1000);
}

watch(dialogOpen, (open) => {
  if (!open) stopScan();
});
onUnmounted(stopScan);

function openCreate() {
  editingId.value = null;
  form.value = { name: "", classId: "", cardUid: "" };
  formError.value = "";
  dialogOpen.value = true;
}

function openEdit(s: Student) {
  editingId.value = s.id;
  form.value = { name: s.name, classId: String(s.classId), cardUid: s.cardUid ?? "" };
  formError.value = "";
  dialogOpen.value = true;
}

const saveMutation = useMutation({
  mutationFn: (input: StudentInput) =>
    editingId.value ? api.updateStudent(editingId.value, input) : api.createStudent(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    dialogOpen.value = false;
  },
  onError: () => {
    formError.value = "Gagal menyimpan data siswa";
  },
});

function onSubmit() {
  formError.value = "";
  if (!form.value.name || !form.value.classId) {
    formError.value = "Nama dan kelas wajib diisi";
    return;
  }
  saveMutation.mutate({
    name: form.value.name,
    classId: Number(form.value.classId),
    cardUid: form.value.cardUid || null,
  });
}

const deleteMutation = useMutation({
  mutationFn: (id: number) => api.deleteStudent(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
});

function onDelete(s: Student) {
  if (confirm(`Hapus siswa "${s.name}"?`)) deleteMutation.mutate(s.id);
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

function sortableHeader(label: string) {
  return ({ column }: { column: { getToggleSortingHandler: () => ((e: unknown) => void) | undefined } }) =>
    h(Button, { variant: "ghost", size: "sm", class: "-ml-2.5", onClick: column.getToggleSortingHandler() }, () => [
      label,
      h(ArrowUpDown, { class: "ml-1.5 size-3.5" }),
    ]);
}

const columns: ColumnDef<typeof features, Student>[] = [
  { accessorKey: "name", header: sortableHeader("Nama") },
  {
    accessorKey: "classId",
    header: sortableHeader("Kelas"),
    cell: ({ row }) => classNameById.value.get(row.original.classId) ?? row.original.classId,
  },
  {
    accessorKey: "cardUid",
    header: sortableHeader("UID Kartu"),
    cell: ({ row }) => row.original.cardUid ?? "-",
  },
  {
    id: "actions",
    header: "Aksi",
    enableSorting: false,
    cell: ({ row }) =>
      h("div", { class: "flex gap-2" }, [
        h(Button, { variant: "outline", size: "sm", onClick: () => openEdit(row.original) }, () => "Edit"),
        h(Button, { variant: "destructive", size: "sm", onClick: () => onDelete(row.original) }, () => "Hapus"),
      ]),
  },
];

const table = useTable({
  features,
  columns,
  data: computed(() => students.value ?? []),
});
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div>
        <h1>Data Siswa</h1>
        <p>{{ students?.length ?? 0 }} siswa terdaftar</p>
      </div>
      <Button class="bg-[var(--brand)] text-white hover:opacity-90" @click="openCreate">Tambah Siswa</Button>
    </div>

    <div class="flex items-center gap-3.5 mb-5 p-3.5 border rounded-md">
      <div class="flex-1">
        <p class="text-[13px] text-muted-foreground mb-0.5">Kode absensi minggu ini (tulis di papan)</p>
        <p class="!mb-0 text-2xl font-bold tracking-widest">{{ attendanceCode?.code ?? "-" }}</p>
      </div>
      <Button
        variant="outline"
        :disabled="generateCodeMutation.isPending.value"
        @click="generateCodeMutation.mutate()"
      >
        {{ generateCodeMutation.isPending.value ? "Membuat..." : "Generate Kode Baru" }}
      </Button>
    </div>

    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender v-if="!header.isPlaceholder" :header="header" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="isLoading" :colspan="columns.length">Loading...</TableEmpty>
        <TableEmpty v-else-if="!students?.length" :colspan="columns.length">Belum ada data siswa.</TableEmpty>
        <TableRow v-for="row in table.getRowModel().rows" v-else :key="row.id">
          <TableCell v-for="cell in row.getAllCells()" :key="cell.id">
            <FlexRender :cell="cell" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingId ? "Edit Siswa" : "Tambah Siswa" }}</DialogTitle>
        </DialogHeader>
        <form class="flex flex-col gap-3.5" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1">
            <Label for="name">Nama</Label>
            <Input id="name" v-model="form.name" required autofocus />
          </div>
          <div class="flex flex-col gap-1">
            <Label for="classId">Kelas</Label>
            <Select v-model="form.classId">
              <SelectTrigger id="classId" class="w-full">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in classes" :key="c.id" :value="String(c.id)">{{ c.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1">
            <Label for="cardUid">UID Kartu (opsional)</Label>
            <div class="flex gap-2">
              <Input id="cardUid" v-model="form.cardUid" :disabled="scanning" />
              <Button type="button" variant="outline" @click="scanning ? stopScan() : startScan()">
                {{ scanning ? "Batal" : "Scan Kartu" }}
              </Button>
            </div>
            <p v-if="scanning" class="text-[13px] text-muted-foreground -mb-1">
              Menunggu tap kartu di reader...
            </p>
            <p v-if="scanError" class="text-[var(--danger)] text-[13px] -mb-1">{{ scanError }}</p>
          </div>
          <p v-if="formError" class="text-[var(--danger)] text-[13px] -mt-1.5 mb-0">{{ formError }}</p>
          <DialogFooter>
            <Button type="submit" :disabled="saveMutation.isPending.value" class="bg-[var(--brand)] text-white hover:opacity-90">
              {{ saveMutation.isPending.value ? "Menyimpan..." : "Simpan" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </main>
</template>