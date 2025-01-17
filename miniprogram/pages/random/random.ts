interface IPageData {
  jsonName: string;
  currentRow: any;
  total: number;
}

Page<IPageData>({
  data: {
    jsonName: '',
    currentRow: null,
    total: 0
  },

  onLoad(options: Record<string, string>) {
    if (options.jsonName) {
      const jsonName = decodeURIComponent(options.jsonName);
      this.setData({ jsonName });
      
      // 获取JSON数据
      const jsonData = wx.getStorageSync(jsonName);
      if (jsonData) {
        this.setData({ total: jsonData.total });
        this.showRandomRow();
      }
    }
  },

  showRandomRow() {
    const jsonData = wx.getStorageSync(this.data.jsonName);
    if (jsonData && jsonData.rows.length > 0) {
      const randomIndex = Math.floor(Math.random() * jsonData.rows.length);
      this.setData({
        currentRow: jsonData.rows[randomIndex]
      });
    }
  },

  onNextTap() {
    this.showRandomRow();
  },

  deleteFile() {
    wx.showModal({
      title: '确认删除',
      content: `是否删除文件 ${this.data.jsonName}？`,
      success: (res) => {
        if (res.confirm) {
          try {
            // 删除本地存储的JSON数据
            wx.removeStorageSync(this.data.jsonName);
            
            // 获取并更新文件列表
            const fileList = wx.getStorageSync('excelFiles') || [];
            const updatedFileList = fileList.filter(
              (item: any) => item.jsonName !== this.data.jsonName
            );
            wx.setStorageSync('excelFiles', updatedFileList);
            
            // 返回上一页
            wx.navigateBack({
              success: () => {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              }
            });
          } catch (error) {
            console.error('删除文件失败：', error);
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  }
}); 