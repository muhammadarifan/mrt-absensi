<script setup lang="ts">
import { computed, h, ref } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  createSortedRowModel,
  FlexRender,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/vue-table";
import { ArrowUpDown } from "@lucide/vue";
import { api, type Student, type StudentInput } from "../lib/api";
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

const queryClient = useQueryClient();

const { data: students, isLoading } = useQuery({
  queryKey: ["students"],
  queryFn: api.getStudents,
});

const { data: classes } = useQuery({
  queryKey: ["classes"],
  queryFn: api.getClasses,
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
    <div class="flex items-center justify-between mb-5">
      <h1 class="!mb-0">Data Siswa</h1>
      <Button class="bg-[var(--brand)] text-white hover:opacity-90" @click="openCreate">Tambah Siswa</Button>
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
            <Input id="cardUid" v-model="form.cardUid" />
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
