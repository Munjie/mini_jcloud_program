// config.js 或在页面 JS 开头
const accountInfo = wx.getAccountInfoSync();
const env = accountInfo.miniProgram.envVersion;

const configs = {
  // 开发版
  develop: {
    baseUrl: 'http://192.168.234.128:8090'
  },
  // 体验版
  trial: {
    baseUrl: 'https://www.munjie.com/api'
  },
  // 正式版
  release: {
    baseUrl: 'https://www.munjie.com/api'
  }
};

// 导出当前环境的配置
export const BASE_URL = configs[env].baseUrl;