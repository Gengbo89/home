/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression";

// index.html 里未定义的 %VITE_*% 会原样残留，进而让 vite-plugin-pwa 在遍历资源时
// 执行 decodeURI 抛出 URIError: URI malformed，导致整个构建失败。
// 这里在构建前把未定义的占位符替换为空字符串，只给出警告，避免因漏配环境变量而构建中断。
function htmlEnvFallback() {
  let env = {};
  let logger = console;
  return {
    name: "html-env-fallback",
    enforce: "pre",
    configResolved(config) {
      env = config.env || {};
      logger = config.logger || console;
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const missing = new Set();
        const result = html.replace(/%([A-Z0-9_]+)%/g, (match, key) => {
          if (!key.startsWith("VITE_") || env[key] !== undefined) {
            return match;
          }
          missing.add(key);
          return "";
        });
        if (missing.size) {
          logger.warn(
            "[html-env-fallback] 未定义的 env 变量: " +
              [...missing].join(", ") +
              " (已按空字符串处理，请检查 .env 或 CI Secrets)",
          );
        }
        return result;
      },
    },
  };
}

// https://vitejs.dev/config/
export default ({ mode }) =>
  defineConfig({
    plugins: [
      vue(),
      htmlEnvFallback(),
      AutoImport({
        imports: ["vue"],
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /(.*?)\.(js|css|woff2|woff|ttf)/, // js / css 静态资源缓存
              handler: "CacheFirst",
              options: {
                cacheName: "js-css-cache",
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /(.*?)\.(png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/, // 图片缓存
              handler: "CacheFirst",
              options: {
                cacheName: "image-cache",
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        manifest: {
          name: loadEnv(mode, process.cwd()).VITE_SITE_NAME,
          short_name: loadEnv(mode, process.cwd()).VITE_SITE_NAME,
          description: loadEnv(mode, process.cwd()).VITE_SITE_DES,
          display: "standalone",
          start_url: "/",
          theme_color: "#424242",
          background_color: "#424242",
          icons: [
            {
              src: "/images/icon/48.png",
              sizes: "48x48",
              type: "image/png",
            },
            {
              src: "/images/icon/72.png",
              sizes: "72x72",
              type: "image/png",
            },
            {
              src: "/images/icon/96.png",
              sizes: "96x96",
              type: "image/png",
            },
            {
              src: "/images/icon/128.png",
              sizes: "128x128",
              type: "image/png",
            },
            {
              src: "/images/icon/144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "/images/icon/192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/images/icon/512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
      viteCompression(),
    ],
    server: {
      port: "3000",
      open: true,
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "src"),
        },
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
          additionalData: `@use "./src/style/global.scss" as *;`,
          silenceDeprecations: ["legacy-js-api"],
        },
      },
    },
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          pure_funcs: ["console.log"],
        },
      },
      rollupOptions: {
        output: {
          // 拆分体积较大且更新频率低的依赖，发版后用户可复用浏览器缓存
          manualChunks: {
            vue: ["vue", "pinia", "pinia-plugin-persistedstate"],
            "element-plus": ["element-plus"],
            swiper: ["swiper", "swiper/vue"],
            aplayer: ["@worstone/vue-aplayer", "aplayer"],
          },
        },
      },
    },
  });
