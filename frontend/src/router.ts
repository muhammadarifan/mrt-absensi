import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "./pages/LoginPage.vue";
import AttendancePage from "./pages/AttendancePage.vue";
import StudentsPage from "./pages/StudentsPage.vue";
import ClassesPage from "./pages/ClassesPage.vue";
import DevicesPage from "./pages/DevicesPage.vue";
import PortalPage from "./pages/PortalPage.vue";
import { getToken } from "./lib/api";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginPage },
    { path: "/portal", component: PortalPage },
    { path: "/", component: AttendancePage, meta: { requiresAuth: true } },
    { path: "/students", component: StudentsPage, meta: { requiresAuth: true } },
    { path: "/classes", component: ClassesPage, meta: { requiresAuth: true } },
    { path: "/devices", component: DevicesPage, meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) {
    return "/login";
  }
});
