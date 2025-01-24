interface IPageData {
  name: string;
  total: number;
  countdown: number;
  timer?: number;
  activeTab: string;
  currentRow: any;
  row: any;
  timerInterval: number;
  playMode: string;
  isSettingsOpen: boolean;
  isPressing: boolean;
  text: string;
  flyDirection: string;
  remainingCount: number | null;
  rememberedCount: number | null;
  showFeedback: string;
  startX: number;
  fontSize: number;
}

Page<IPageData>({
  data: {
    name: '',
    total: 0,
    countdown: 10,
    activeTab: 'learning',
    currentRow: null,
    row: null,
    isPressing: false,
    text: '',
    flyDirection: 'right',
    remainingCount: null,
    rememberedCount: null,
    isSettingsOpen: false,
    timerInterval: 5, // 默认5秒
    playMode: 'loop', // 默认循环模式
    showFeedback: '',
    startX: 0,
    fontSize: 16, // 默认字体大小
  },

  onLoad(options: Record<string, string>) {
    if (options.name) {
      const name = decodeURIComponent(options.name);
      this.setData({ name });
      this.showNextRow();
      this.startTimer();
    }

    // 读取本地存储的设置
    const savedInterval = wx.getStorageSync('timerInterval');
    const savedMode = wx.getStorageSync('playMode');
    const savedFontSize = wx.getStorageSync('fontSize');
    
    this.setData({
      timerInterval: savedInterval || 5,
      playMode: savedMode || 'loop',
      fontSize: savedFontSize || 16
    });
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

    this.setData({ countdown: this.data.timerInterval });

    // 创建新的定时器
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1;

      if (countdown <= 0) {
        // 倒计时结束，显示新数据
        this.showNextRow();
        this.setData({ countdown: this.data.timerInterval });

      } else {
        // 更新倒计时
        this.setData({ countdown });
      }
    }, 1000);

    // @ts-ignore - 将timer保存到this.data中
    this.setData({ timer });
  },

  showNextRow() {

    const remainingData = wx.getStorageSync(`${this.data.name}_remaining`);
    const rememberedData = wx.getStorageSync(`${this.data.name}_remembered`);
    if (remainingData && rememberedData) {
      this.setData({
        remainingCount: remainingData.data.length,
        rememberedCount: rememberedData.data.length
      })
    }
    let availableRows = []
    if (this.data.activeTab === 'learning') {
      if (remainingData && remainingData.data.length >= 0) {
        availableRows = remainingData.data;
        if (availableRows.length === 0) {
          wx.showModal({
            title: '恭喜',
            content: '你已经记住了所有的内容！',
            showCancel: false,
            success: () => {
              if (rememberedData && rememberedData.data.length > 0) {
                this.setData({activeTab: 'remembered'});
                availableRows = rememberedData.data;
              } else {
                wx.navigateBack();
              }
            }
          });
          return;
        }
      }
    }
    else {
      if (rememberedData && rememberedData.data.length >= 0) {
        availableRows = rememberedData.data;
        if (availableRows.length === 0) {
          wx.showModal({
            title: '提示',
            content: '你还没有已记住的内容！',
            showCancel: false,
            success: () => {
              if (remainingData && remainingData.data.length > 0) {
                this.setData({activeTab: 'learning'});
                availableRows = remainingData.data;
              } else {
                wx.navigateBack();
              }
            }
          });
          return;
        }
      }
    }
    const randomIndex = Math.floor(Math.random() * availableRows.length);
    let nextIndex = 0
    if (this.data.playMode === 'random') {
      nextIndex = randomIndex
    }
    else {
      nextIndex = this.data.row ? this.data.row.index + 1 : 0
      if (nextIndex >= availableRows.length) {
        nextIndex = 0;
      }
    }

    let row = availableRows.find(row => row.index === nextIndex);

    if (!row) {
      row = availableRows
        .filter(row => row.index > nextIndex)
        .sort((a, b) => a.index - b.index)[0];
    };
    const rowContent = Object.values(row).filter(value => value !== row.index).map(value => String(value));
    this.setData({
      currentRow: rowContent,
      row: row
    });


  },

  onLongPress() {
    if (!this.data.isSettingsOpen) {
      const direction = this.data.activeTab === 'learning' ? 'right' : 'left';
      this.setData({ isPressing: true, flyDirection: direction });
      if (this.data.activeTab === 'learning') {
        this.onRemembered();
        this.setData({ text: '已标记为已记住' });
      }
      else {
        this.onNotRemembered();
        this.setData({ text: '已标记为没记住' });
      }
      setTimeout(() => {
        this.setData({ isPressing: false });
      }, 800);
    }
    else {
      this.setData({
        isSettingsOpen: false
      });
    }
  },

  onShortPress() {
    if (!this.data.isSettingsOpen) {
      this.showNextRow();
      this.startTimer();
    }
    else {
      this.setData({
        isSettingsOpen: false
      });
    }
  },

  onRemembered() {

    if (this.data.activeTab === 'learning') {
      const remainingData = wx.getStorageSync(`${this.data.name}_remaining`);
      const rememberedData = wx.getStorageSync(`${this.data.name}_remembered`);
      remainingData.data = remainingData.data.filter(row => row.index !== this.data.row.index);
      wx.setStorageSync(`${this.data.name}_remaining`, remainingData);
      rememberedData.data.push(this.data.row);
      wx.setStorageSync(`${this.data.name}_remembered`, rememberedData);
    }

    this.showNextRow();
    this.startTimer();

  },

  onNotRemembered() {

    if (this.data.activeTab === 'remembered') {
      const remainingData = wx.getStorageSync(`${this.data.name}_remaining`);
      const rememberedData = wx.getStorageSync(`${this.data.name}_remembered`);
      rememberedData.data = rememberedData.data.filter(row => row.index !== this.data.row.index);
      wx.setStorageSync(`${this.data.name}_remembered`, rememberedData);
      remainingData.data.push(this.data.row)
      wx.setStorageSync(`${this.data.name}_remaining`, remainingData);
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
  },

  // 切换设置菜单
  toggleSettings() {
    this.setData({
      isSettingsOpen: !this.data.isSettingsOpen
    });
  },

  // 时间轴改变事件
  onTimerChange(e: WechatMiniprogram.SliderChange) {
    const newInterval = e.detail.value;
    this.setData({
      timerInterval: newInterval
    });
    // 保存到本地存储
    wx.setStorageSync('timerInterval', newInterval);
    // 触发定时器更新
    this.updateTimer();
  },

  // 更新定时器
  updateTimer() {
    // TODO: 实现定时器更新逻辑
    console.log(`Timer updated to ${this.data.timerInterval} seconds`);
  },

  // 切换播放模式
  onModeChange(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ playMode: mode });
    wx.setStorageSync('playMode', mode);
    // TODO: 更新播放模式逻辑
    console.log(`Play mode changed to: ${mode}`);
  },

  // 字体大小改变事件
  onFontSizeChange(e: WechatMiniprogram.SliderChange) {
    const newSize = e.detail.value;
    this.setData({ fontSize: newSize });
    wx.setStorageSync('fontSize', newSize);
    
    // 更新页面内容的字体大小
    this.updateContentFontSize();
  },

  // 更新内容字体大小
  updateContentFontSize() {
    const query = wx.createSelectorQuery();
    query.selectAll('.content').fields({
      dataset: true,
      size: true,
    }, (res) => {
      if (res) {
        console.log(this.data.fontSize)
        // 使用CSS变量更新字体大小
        wx.nextTick(() => {
          this.setData({
            ['--content-font-size']: `${this.data.fontSize}rpx`
          });
        });
      }
    }).exec();
  },
}); 