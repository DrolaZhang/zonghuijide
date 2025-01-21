interface IPageData {
  name: string;
  total: number;
  countdown: number;
  timer?: number;
  activeTab: string;
  currentRow: any;
  row: any;
}

Page<IPageData>({
  data: {
    name: '',
    total: 0,
    countdown: 10,
    activeTab: 'learning',
    currentRow: null,
    row: null
  },

  onLoad(options: Record<string, string>) {

    if (options.name) {
      const name = decodeURIComponent(options.name);
      this.setData({ name });
      this.showNextRow();
      this.startTimer();
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
        this.showNextRow();
        this.setData({ countdown: 10 });
      } else {
        // 更新倒计时
        this.setData({ countdown });
      }
    }, 1000);

    // @ts-ignore - 将timer保存到this.data中
    this.setData({ timer });
  },

  showNextRow() {
    this.setData({
      currentRow: [],
      row: null
    });
    const remainingData = wx.getStorageSync(`${this.data.name}_remaining`);
    const rememberedData = wx.getStorageSync(`${this.data.name}_remembered`);

    if (this.data.activeTab === 'learning') {

      if (remainingData && remainingData.data.length > 0) {
        const availableRows = remainingData.data;
        if (availableRows.length === 0) {
          wx.showModal({
            title: '恭喜',
            content: '你已经记住了所有的内容！',
            showCancel: false,
            success: () => {
              wx.navigateBack();
            }
          });
          return;
        }

        const randomIndex = Math.floor(Math.random() * availableRows.length);

        const row = availableRows[randomIndex];
        // rowcontent should not include index
        const rowContent = Object.values(row).filter(value => value !== row.index).map(value => String(value)); 

        // const rowContent = Object.values(row).map(value => String(value));

        this.setData({
          currentRow: rowContent,
          row: row
        });
      }
    }
    else {
      if (rememberedData && rememberedData.data.length > 0) {
        const availableRows = rememberedData.data;
        const randomIndex = Math.floor(Math.random() * availableRows.length);
        const row = availableRows[randomIndex];
        const rowContent = Object.values(row).filter(value => value !== row.index).map(value => String(value)); 
        this.setData({
          currentRow: rowContent,
          row: row
        });
      }
    }
  },

  onLongPress() {
    if(this.data.activeTab === 'learning') {
      this.onRemembered();
    }
    else {
      this.onNotRemembered();
    }
  },

  onShortPress() {
    this.showNextRow();
    this.startTimer();
  },

  onRemembered() {
    const remainingData = wx.getStorageSync(`${this.data.name}_remaining`);
    const rememberedData = wx.getStorageSync(`${this.data.name}_remembered`);
    // if remaining data is null, then isInRemaining is false 
    const isInRemaining = remainingData ? remainingData.data.find(row =>
      row.index === this.data.row.index
    ) : false;
    if (isInRemaining) {
      remainingData.data = remainingData.data.filter(row => row.index !== this.data.row.index);
      wx.setStorageSync(`${this.data.name}_remaining`, remainingData);
    }
    // 如果当前行不在rememberedData列表中，则添加
    const isAlreadyRemembered = rememberedData ? rememberedData.data.find(row =>
      row.index === this.data.row.index) : false;
    if (!isAlreadyRemembered) {
      rememberedData.data.push(this.data.row);
      wx.setStorageSync(`${this.data.name}_remembered`, rememberedData);
    }

    this.showNextRow();
    this.startTimer();

  },

  onNotRemembered() {
    const remainingData = wx.getStorageSync(`${this.data.name}_remaining`);
    const rememberedData = wx.getStorageSync(`${this.data.name}_remembered`);

    const isInRemaining = remainingData.data.find(row =>
      row.index === this.data.row.index
    );
    if (!isInRemaining) {
      remainingData.data.push(this.data.row)
      wx.setStorageSync(`${this.data.name}_remaining`, remainingData);
    }
    // 如果当前行不在rememberedData列表中，则添加
    const isAlreadyRemembered = rememberedData ? rememberedData.data.find(row =>
      row.index === this.data.row.index) : false;
    if (isAlreadyRemembered) {
      rememberedData.data = rememberedData.data.filter(row => row.index !== this.data.row.index);
      wx.setStorageSync(`${this.data.name}_remembered`, rememberedData);
    }
    this.showNextRow();
    this.startTimer();
  },

  deleteFile() {
    wx.showModal({
      title: '确认删除',
      content: `是否删除文件 ${this.data.name}？`,
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除定时器
            this.clearTimer();

            // 删除本地存储的JSON数据
            wx.removeStorageSync(this.data.name);

            // 获取并更新文件列表
            const fileList = wx.getStorageSync('excelFiles') || [];
            const updatedFileList = fileList.filter(
              (item: any) => item.name !== this.data.name
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
  },

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.showNextRow();
    this.startTimer();
  }


}); 