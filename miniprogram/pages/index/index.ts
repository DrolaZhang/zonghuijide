// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Component({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  methods: {
    // 事件处理函数
    bindViewTap() {
      wx.navigateTo({
        url: '../logs/logs',
      })
    },
    onChooseAvatar(e: any) {
      const { avatarUrl } = e.detail
      const { nickName } = this.data.userInfo
      this.setData({
        "userInfo.avatarUrl": avatarUrl,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    onInputChange(e: any) {
      const nickName = e.detail.value
      const { avatarUrl } = this.data.userInfo
      this.setData({
        "userInfo.nickName": nickName,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    getUserProfile() {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => {
          console.log('获取用户信息成功：', res)
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        },
        fail: (err) => {
          console.error('获取用户信息失败：', err)
        }
      })
    },

    goToHome() {
      if (this.data.hasUserInfo) {
        wx.navigateTo({
          url: `/pages/home/home?nickName=${encodeURIComponent(this.data.userInfo.nickName)}&avatarUrl=${encodeURIComponent(this.data.userInfo.avatarUrl)}`,
          success: (res) => {
            console.log('跳转成功', res)
          },
          fail: (err) => {
            console.error('跳转失败', err)
          }
        })
      } else {
        wx.showToast({
          title: '请先获取用户信息',
          icon: 'none'
        })
      }
    }
  },
})
