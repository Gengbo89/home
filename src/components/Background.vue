<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img
      v-show="store.imgLoadStatus"
      :src="bgUrl"
      class="bg"
      alt="cover"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <div :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
    <Transition name="fade" mode="out-in">
      <a v-if="store.backgroundShow && bgUrl" class="down" :href="bgUrl" target="_blank">
        下载壁纸
      </a>
    </Transition>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error } from "@icon-park/vue-next";
// 本地壁纸清单由构建期扫描 public/images 目录生成（见 vite.config.js 的 localBackgrounds 插件），
// 以后增删壁纸图片只需改动目录，无需修改这里的文件名列表。
import bgList from "virtual:backgrounds";

const store = mainStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
const emit = defineEmits(["loadComplete"]);

// 连续加载失败次数，超过上限后放行，避免一直卡在加载页
const bgErrorCount = ref(0);
const bgMaxError = 3;

// 随机取一张本地壁纸（尽量不与当前这张重复）
const randomBg = () => {
  if (!bgList.length) return "";
  if (bgList.length === 1) return bgList[0];
  let next = bgUrl.value;
  while (next === bgUrl.value) {
    next = bgList[Math.floor(Math.random() * bgList.length)];
  }
  return next;
};

// 图片加载完成
const imgLoadComplete = () => {
  bgErrorCount.value = 0;
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 图片动画完成
const imgAnimationEnd = () => {
  // 加载完成事件
  emit("loadComplete");
};

// 图片显示失败
const imgLoadError = () => {
  console.error("壁纸加载失败：", bgUrl.value);
  bgErrorCount.value++;
  // 多次失败后直接放行，避免一直卡在加载页
  if (bgErrorCount.value > bgMaxError) {
    store.setImgLoadStatus(true);
    ElMessage({
      message: "壁纸加载失败，已使用默认背景",
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
    return;
  }
  ElMessage({
    message: "壁纸加载失败，已临时切换回默认",
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  // 换一张不同的本地壁纸，地址变化才能重新触发 load 事件
  bgUrl.value = randomBg();
};

onMounted(() => {
  // 没有任何本地壁纸时直接放行，避免卡在加载页
  if (!bgList.length) {
    store.setImgLoadStatus(true);
    return;
  }
  bgUrl.value = randomBg();
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
});
</script>

<style lang="scss" scoped>
.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.25s;
  z-index: -1;

  &.show {
    z-index: 1;
  }

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    filter: blur(20px) brightness(0.3);
    transition:
      filter 0.3s,
      transform 0.3s;
    animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.45s;
  }
  .gray {
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);

    transition: 1.5s;
    &.hidden {
      opacity: 0;
      transition: 1.5s;
    }
  }
  .down {
    font-size: 16px;
    color: white;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: block;
    padding: 20px 26px;
    border-radius: 8px;
    background-color: #00000030;
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover {
      transform: scale(1.05);
      background-color: #00000060;
    }
    &:active {
      transform: scale(1);
    }
  }
}
</style>
