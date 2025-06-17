// index.ts
interface IPageData {
    // 添加需要的页面数据
}

Page<IPageData>({
    data: {
        // 初始化页面数据
    },

    goToHome(): void {
        wx.navigateTo({
            url: '/pages/home/home'
        });
    },

    goToCard() {
        wx.navigateTo({
            url: '/pages/card/card'
        });
    },

    goToDiary() {
        wx.navigateTo({
            url: '/pages/diary/diary'
        });
    }
}) 