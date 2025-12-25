
const BASE_URL = 'https://www.munjie.com/api'
// const BASE_URL = 'http://192.168.234.128:8090'

Page({
  data: {
    scene: '',          // 从二维码带来的 scene 参数
    openid: '',
    avatarUrl: '',
    nickName: '',
    loading: false,
    buttonText: '确认登录'
  },

  onLoad(options) {
    // 获取二维码中携带的 scene 参数（必须）
    const scene = options.scene || ''
    if (!scene) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      return
    }
    this.setData({ scene })
  },
  // 用户点击按钮触发（关键！）
  onGetUserInfo(e) {
    // 用户拒绝授权
    if (!e.detail.userInfo) {
      wx.showToast({ title: '需要授权才能登录', icon: 'none' })
      return
    }

    const userInfo = e.detail.userInfo
    this.setData({
      avatarUrl: userInfo.avatarUrl,
      nickName: userInfo.nickName,
      loading: true,
      buttonText: '登录中...'
    })

    // 开始 wx.login 获取 code
    wx.login({
      success: res => {
        if (res.code) {
          this.getOpenid(res.code)
        } else {
          this.fail('登录失败')
        }
      }
    })
  },

  // 第二步：调用后端接口换取 openid
  getOpenid(code) {
    wx.request({
      url: `${BASE_URL}/wechat/code2session`,
      data: { code },
      method: 'GET',
      dataType: 'json',
      success: res => {
        console.log('code2session 返回:', res.data.data.openid)
        if (res.data) {
          this.setData({ openid: res.data.data.openid })
          this.bindScene(res.data.data.openid)
        } else {
          this.fail('获取 openid 失败')
        }
      },
      fail: () => this.fail('网络错误')
    })
  },

  // 第三步：将 openid + scene 绑定，触发 Web 端登录
  bindScene(openid) {
    wx.request({
      url: `${BASE_URL}/wechat/bind`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        scene: this.data.scene,
        openid: openid
      },
      success: res => {
        console.log('绑定，触发 返回:', res.data.data)
        if (res.data.data === true) {
          this.setData({
            buttonText: '授权成功！'
          })
          wx.showModal({
            title: '提示',
            content: '授权成功,网页即将登录,请点击确定关闭。',
            showCancel: false,
            success: res => {
              if (res.confirm) {
                wx.exitMiniProgram({
                  success: () => console.log('小程序已退出'),
                  fail: err => console.error('退出失败', err)
                })
              }
            }
          })
          
          

          // 可选：3秒后自动关闭小程序（提升体验）
          setTimeout(() => {
            wx.navigateBack({ delta: 10 }) // 尝试返回多层关闭
          }, 3000)
        } else {
          this.fail('授权登录失败')
        }
      },
      fail: () => this.fail('网络错误'),
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  fail(msg) {
    this.setData({
      loading: false,
      buttonText: '重新授权登录'
    })
    wx.showToast({ title: msg, icon: 'none' })
  }
})