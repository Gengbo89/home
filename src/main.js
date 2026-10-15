import { createApp } from "vue";
import "@/style/style.scss";
import App from "@/App.vue";
// 引入 pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// swiper
import "swiper/css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.mount("#app");

// PWA
// 首次访问时 Service Worker 通过 clientsClaim 接管页面也会触发 controllerchange，
// 这种情况并不需要提示刷新，因此只在“原本已有 SW 接管”时提示更新
const hadController = !!navigator.serviceWorker.controller;
navigator.serviceWorker.addEventListener("controllerchange", () => {
  if (!hadController) {
    return;
  }
  // 弹出更新提醒
  ElMessage("站点已更新，刷新后生效");
});
