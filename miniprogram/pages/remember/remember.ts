interface IPageData {
  jsonName: string;
  rememberRow: string[];
  rememberedRow: string[];
  total: number;
  countdown: number;
  timer?: number;
  rememberedCount: number;
  activeTab: string;
}

Page<IPageData>({
  data: {
    jsonName: '',
    rememberRow: [],
    rememberedRow: [],
    total: 0,
    countdown: 10,
    rememberedCount: 0,
    activeTab: 'learning'
  },

  onLoad(options: Record<string, string>) {
    if (options.jsonName) {
      const jsonName = decodeURIComponent(options.jsonName);
      this.setData({ jsonName });
      
      // 获取JSON数据和已记住的数据
      const jsonData = wx.getStorageSync(jsonName);
      const rememberedData = wx.getStorageSync(`${jsonName}_remembered`) || [];
      
      if (jsonData) {
        this.setData({ 
          total: jsonData.total,
          rememberedCount: rememberedData.length
        });
        this.showNextRow();
        this.startTimer();
      }
      console.log(jsonData)
      console.log(rememberedData)
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
    const jsonData = wx.getStorageSync(this.data.jsonName);
    const rememberedData = wx.getStorageSync(`${this.data.jsonName}_remembered`) || [];
    
    if (jsonData && jsonData.rows.length > 0) {
      // 过滤掉已记住的行
      const availableRows = jsonData.rows.filter(row => 
        !rememberedData.some((remembered: any) => 
          JSON.stringify(row) === JSON.stringify(remembered)
        )
      );

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
      const randomIndexOfRememberd = Math.floor(Math.random() * rememberedData.length);
      const row = availableRows[randomIndex];
      
      // 将对象的值转换为字符串数组
      const rowContent = Object.values(row).map(value => String(value));
      const rememberedRow = Object.values(rememberedData[randomIndexOfRememberd]).map(value => String(value));
      this.setData({
        rememberRow: rowContent,
        rememberedRow: rememberedRow
      });
      console.log(this.data.rememberRow)
      console.log(rememberedData)
    }
  },

  onRemembered() {
    const jsonData = wx.getStorageSync(this.data.jsonName);
    const rememberedData = wx.getStorageSync(`${this.data.jsonName}_remembered`) || [];
    
    // 找到当前显示的行
    const currentRowStr = this.data.rememberRow.join('');
    const currentRowData = jsonData.rows.find(row => 
      Object.values(row).join('') === currentRowStr
    );

    if (currentRowData) {
      // 添加到已记住列表
      rememberedData.push(currentRowData);
      wx.setStorageSync(`${this.data.jsonName}_remembered`, rememberedData);
      
      this.setData({ rememberedCount: rememberedData.length });
      
      // 显示下一行
      this.showNextRow();
      this.startTimer();
    }
  },

  onNotRemembered() {
    this.showNextRow();
    this.startTimer();
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
  },

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  }
}); 