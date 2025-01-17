interface IPageData {
  jsonName: string;
  currentRow: string;
  total: number;
  countdown: number;
  timer?: number;
}

Page<IPageData>({
  data: {
    jsonName: '',
    currentRow: '',
    total: 0,
    countdown: 10
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
        this.startTimer();
      }
    }
  },

  onUnload() {
    // 页面卸载时清除定时器
    this.clearTimer();
  },

  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  startTimer() {
    // 清除可能存在的旧定时器
    this.clearTimer();
    
    // 重置倒计时
    this.setData({ countdown: 10 });
    
    // 创建新的定时器
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1;
      
      if (countdown <= 0) {
        // 倒计时结束，显示新数据
        this.showRandomRow();
        this.setData({ countdown: 10 });
      } else {
        // 更新倒计时
        this.setData({ countdown });
      }
    }, 1000);

    // @ts-ignore - 将timer保存到this.data中
    this.setData({ timer });
  },

  showRandomRow() {
    const jsonData = wx.getStorageSync(this.data.jsonName);
    if (jsonData && jsonData.rows.length > 0) {
      const randomIndex = Math.floor(Math.random() * jsonData.rows.length);
      // 将对象的所有值连接成一个字符串
      const rowContent = Object.values(jsonData.rows[randomIndex]).join(' ');
      this.setData({
        currentRow: rowContent
      });
    }
  },

  onNextTap() {
    this.showRandomRow();
    this.startTimer(); // 重置定时器
  },

  deleteFile() {
    wx.showModal({
      title: '确认删除',
      content: `是否删除文件 ${this.data.jsonName}？`,
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除定时器
            this.clearTimer();
            
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