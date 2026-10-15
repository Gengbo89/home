<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span v-if="temperatureText">{{ temperatureText }}&nbsp;</span>
    <span class="sm-hidden" v-if="windText">&nbsp;{{ windText }}&nbsp;</span>
    <span class="sm-hidden" v-if="weatherData.weather.windpower">
      {{ weatherData.weather.windpower }}&nbsp;级
    </span>

  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getAdcode, getWeather, getOtherWeather } from "@/api";
import { Error } from "@icon-park/vue-next";

// 高德开发者 Key
const mainKey = import.meta.env.VITE_WEATHER_KEY;

// 天气数据
const weatherData = reactive({
  adCode: {
    city: null, // 城市
    adcode: null, // 城市编码
  },
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

// 气温文案（接口缺失气温时不再显示 “null℃”）
const temperatureText = computed(() => {
  const temperature = weatherData.weather.temperature;
  if (temperature === null || temperature === undefined || temperature === "") {
    return "";
  }
  return `${temperature}℃`;
});

// 风向文案（接口缺失风向时不再显示 “undefined风”）
const windText = computed(() => {
  const direction = weatherData.weather.winddirection;
  if (!direction) {
    return "";
  }
  return direction.endsWith("风") ? direction : `${direction}风`;
});

// 取出天气平均值
const getTemperature = (min, max) => {
  // Number(undefined) 不会抛错，而是返回 NaN，因此这里显式判断
  const average = (Number(min) + Number(max)) / 2;
  return Number.isFinite(average) ? Math.round(average) : null;
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    // 获取地理位置信息
    if (!mainKey) {
      const result = await getOtherWeather();
      const data = result?.result;
      if (!data?.city || !data?.condition) {
        throw new Error("备用天气接口返回数据异常");
      }
      weatherData.adCode = {
        city: data.city.City || "未知地区",
        // adcode: data.city.cityId,
      };
      weatherData.weather = {
        weather: data.condition.day_weather,
        temperature: getTemperature(data.condition.min_degree, data.condition.max_degree),
        winddirection: data.condition.day_wind_direction,
        windpower: data.condition.day_wind_power,
      };
    } else {
      // 获取 Adcode
      const adCode = await getAdcode(mainKey);
      // 无法定位城市时高德会返回空数组或空字符串，这里统一判断
      const city = typeof adCode.city === "string" ? adCode.city.trim() : "";
      if (adCode.infocode !== "10000" || !city) {
        throw new Error("地区查询失败");
      }
      weatherData.adCode = {
        city,
        adcode: adCode.adcode,
      };
      // 获取天气信息
      const result = await getWeather(mainKey, weatherData.adCode.adcode);
      const live = result?.lives?.[0];
      if (!live) {
        throw new Error("天气信息获取失败");
      }
      weatherData.weather = {
        weather: live.weather,
        temperature: live.temperature,
        winddirection: live.winddirection,
        windpower: live.windpower,
      };
    }
  } catch (error) {
    onError("天气信息获取失败", error);
  }
};

// 报错信息
const onError = (message, error) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message, error ?? "");
};

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>
