const BASE_URL = 'https://www.munjie.com/api'
// const BASE_URL = 'http://192.168.234.128:8090'

// 默认灰色头像占位图
const DEFAULT_AVATAR = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    scene: '',
    openid: '',
    avatarUrl: '',     
    nickName: '',
    defaultAvatar: DEFAULT_AVATAR,
    hasUserInfo: false,
    loading: true,
    isExistingUser: false, // 标识是否为老用户
    buttonText: '立即登录'
  },

  onLoad(options) {
    const scene = options.scene || ''
    this.setData({ 
      scene, 
      loading: true, 
      buttonText: '识别中...' 
    });
    // 1. 第一步：静默获取 openid 并检查用户是否存在
    try {
      wx.login({
        success: res => {
          if (res.code) {
             this.checkUserStatus(res.code);
          } else {
            this.fail('登录失败')
          }
        }
      })
       
    } catch (err) {
      this.fail('初始化失败');
    }finally{
      this.setData({ loading: false });
    if (!this.data.buttonText || this.data.buttonText === '识别中...') {
      this.setData({ buttonText: '立即登录' });
    }
    }
    if (scene) {
      this.setData({ scene })
      this.bindScene() // 扫码绑定
    }
  },

  // 检查用户是否已注册
  checkUserStatus(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${BASE_URL}/wechat/userInfo`, 
        data: { code },
        success: (res) => {
          const user = res.data.data;
          if (user && user.registered) {
            this.setData({
              openid: user.openid,
              nickName: user.userName,
              avatarUrl: user.avatar,
              isExistingUser: true,
              hasUserInfo: true,
              loading: false,
              buttonText: `立即登录`
            });
          } else {
            // 新用户，展示设置界面
            this.setData({ 
              openid: user.openid, 
              loading: false 
            });
          }
          resolve();
        },
        fail: reject
      });
    });
  },


  // 1. 选择头像（只保存临时路径，暂不上传）
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ 
      avatarUrl: avatarUrl, // 页面立即回显
      hasUserInfo: true
    })
  },

  onNicknameChange(e) {
    this.setData({ nickName: e.detail.value })
  },

  // 2. 点击登录主入口
  async handleLogin() {
    this.setData({ loading: true, buttonText: '登录中...' })
    let finalAvatarUrl = this.data.avatarUrl;
    // 如果是新用户，且选了临时头像，先上传
    if (!this.data.isExistingUser &&  this.data.avatarUrl) {
      try {
        finalAvatarUrl = await this.uploadAvatar(this.data.avatarUrl);
      } catch (e) {
        this.fail('头像同步失败');
        return;
      }
    }
    // 执行确认登录
    this.confirmLogin(this.data.openid, finalAvatarUrl);
  },

  // 3. 上传文件 Promise 封装
  uploadAvatar(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${BASE_URL}/wechat/upload`, 
        filePath: filePath,
        name: 'file',
        success: (res) => {
          try {
            const result = JSON.parse(res.data);
            if (result.code === 200 && result.data) {
              console.log('头像上传成功:', result.data);
              resolve(result.data); // 直接返回 URL 字符串
            } else {
              reject(result.message || '上传接口返回错误');
            }
          } catch (e) {
            console.error('解析上传响应失败', e);
            reject('解析响应失败');
          }
        },
        fail: (err) => reject(err)
      })
    });
  },

  // 4. 获取OpenID并提交最终信息
  getOpenidAndConfirm(code, permanentAvatarUrl) {
    wx.request({
      url: `${BASE_URL}/wechat/code2session`,
      data: { code },
      success: res => {
        const openid = res.data.data.openid;
        if (openid) {
          this.confirmLogin(openid, permanentAvatarUrl);
        } else {
          this.fail('身份识别失败');
        }
      },
      fail: () => this.fail('网络连接失败')
    })
  },

  // 5. 提交所有信息给后端保存
  confirmLogin(openid, avatarUrl) {
    wx.request({
      url: `${BASE_URL}/wechat/confirm`,
      method: 'POST',
      data: {
        scene: this.data.scene,
        openid: openid,
        nickName: this.data.nickName,
        avatarUrl: avatarUrl 
      },
      success: (res) => {
        if (res.data.data === true) {
          this.setData({ buttonText: '欢迎回来', loading: false })
          wx.showModal({
            title: '提示',
            content: '网页即将登录,请点击确定关闭。',
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
        } else {
          this.fail('登录被拒绝');
        }
      },
      fail: () => this.fail('服务器未响应')
    })
  },

  // 绑定 Scene，提示博客端已扫码
  bindScene() {
    wx.request({
      url: `${BASE_URL}/wechat/bind`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { scene: this.data.scene },
      success: res => {
        if (res.data.data === true) {
          wx.showToast({ title: '扫码成功', icon: 'success' })
        } else {
          wx.showToast({ title: '扫码关联失败', icon: 'none' })
        }
      },
      fail: () => console.error('Bind scene network error')
    })
  },




  fail(msg) {
    this.setData({
      loading: false,
      buttonText: '重试登录'
    })
    wx.showToast({ title: msg, icon: 'none' })
  }
})