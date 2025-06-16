// index.ts
Page({
    data: {
        // 页面数据
    },

    goToHome(): void {
        wx.navigateTo({
            url: '/pages/home/home'
        });
    },

    goToCard(): void {
        wx.navigateTo({
            url: '/pages/card/card'
        });
    }
}) 