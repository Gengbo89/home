// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  if (!import.meta.env.VITE_SONG_API) {
    throw new Error("未配置音乐接口地址（VITE_SONG_API）");
  }
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  if (!res.ok) {
    throw new Error(`音乐接口请求失败（HTTP ${res.status}）`);
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("音乐接口返回了非法数据");
  }
  // 接口异常时可能返回空数组或错误对象，这里统一拦截，避免后续取下标报错
  if (!Array.isArray(data) || data.length === 0 || !data[0]?.url) {
    throw new Error("音乐接口未返回有效歌单，请检查歌单 ID 是否正确");
  }

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const sip = jsonpData?.req_0?.data?.sip;
    const midurlinfo = jsonpData?.req_0?.data?.midurlinfo;
    if (!Array.isArray(sip) || !sip.length || !Array.isArray(midurlinfo)) {
      throw new Error("音乐接口返回了非法数据");
    }
    const domain = (sip.find((i) => !i.startsWith("http://ws")) || sip[0]).replace(
      "http://",
      "https://",
    );

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + (midurlinfo[i]?.purl || ""),
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://api.gengbo.top/hitokoto-api");
  if (!res.ok) {
    throw new Error(`一言接口请求失败（HTTP ${res.status}）`);
  }
  return await res.json();
};

/**
 * 天气
 */

// 获取高德地理位置信息
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  if (!res.ok) {
    throw new Error(`地区查询失败（HTTP ${res.status}）`);
  }
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  if (!res.ok) {
    throw new Error(`天气查询失败（HTTP ${res.status}）`);
  }
  return await res.json();
};

// 获取教书先生天气 API
// https://api.oioweb.cn/doc/weather/GetWeather
export const getOtherWeather = async () => {
  const res = await fetch("https://api.oioweb.cn/api/weather/GetWeather");
  if (!res.ok) {
    throw new Error(`天气查询失败（HTTP ${res.status}）`);
  }
  return await res.json();
};
