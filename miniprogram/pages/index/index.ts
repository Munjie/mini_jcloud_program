// 定义天气数据接口
interface WeatherData {
  temp: string;
  text: string;
  humidity: string;
  windSpeed: string;
}

Page({
  data: {
    city: '北京市',
    temp: '--',
    desc: 'Loading',
    humidity: '0',
    wind: '0',
    apiKey: 'fc6030aa252140969ed110de8d02d72b' 
  },

  onLoad() {
    this.getWeather('101010100'); 
  },

  // 搜索处理
  onSearch(e: any) {
    const cityName = e.detail.value;
    if (!cityName) return;
    this.setData({ city: cityName });
    this.getWeather('101010100'); 
  },

  async getWeather(location: string) {
    const { apiKey } = this.data;
    wx.request({
      url: `https://pc5khj4wxy.re.qweatherapi.com/v7/weather/now`,
      data: {
        location,
        key: apiKey
      },
      success: (res: any) => {
        if (res.data.now) {
          const now = res.data.now as WeatherData;
          this.setData({
            temp: now.temp,
            desc: now.text,
            humidity: now.humidity,
            wind: now.windSpeed
          });
        }
      }
    });
  }
});