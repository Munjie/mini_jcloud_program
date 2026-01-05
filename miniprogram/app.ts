// app.ts
interface IAppOption {
  checkUpdate: () => void,
  checkCacheCompatibility: () => void
}

App<IAppOption>({
  globalData: {},
  onLaunch() {
    this.checkUpdate();
    this.checkCacheCompatibility();
    // 登录
    wx.login({
      success: res => {
        console.log('App Login Code:', res.code)
      },
    })
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) console.log('发现新版本');
      });
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          showCancel: false,
          success: (res) => {
            if (res.confirm) updateManager.applyUpdate();
          }
        });
      });
      updateManager.onUpdateFailed(() => {
        wx.showToast({
          title: '自动更新失败，请删除小程序重新搜索Jie云打开',
          icon: 'none',
          duration: 2000
        });
      });
    }
  },

  checkCacheCompatibility() {
    const VERSION_TAG = '1.0.1'; 
    const lastVersion = wx.getStorageSync('app_version_tag');
    if (lastVersion !== VERSION_TAG) {
      wx.setStorageSync('app_version_tag', VERSION_TAG);
    }
  }
})