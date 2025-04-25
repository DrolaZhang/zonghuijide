interface IPageData {
  name: string;
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
  remainingCount: number | null;
  rememberedCount: number | null;
  fontSize: number;
  currentIndex: number;
  isTimerPaused: boolean;
  tapCount: number;
  cardCount: number;
  currentItem: any;
}

Page<IPageData>({
  data: {
    name: '',
    countdown: 10,
    activeTab: 'learning',
    currentRow: null,
    row: null,
    isPressing: false,
    text: '',
    remainingCount: null,
    rememberedCount: null,
    isSettingsOpen: false,
    timerInterval: 5, // 默认5秒
    playMode: 'loop', // 默认循环模式
    fontSize: 16, // 默认字体大小
    currentIndex: -1,
    isTimerPaused: false,
    cardCount: 0,
    currentItem: null,
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

    this.updateCardCount();
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
    this.clearTimer();
    this.setData({ countdown: this.data.timerInterval });
    if (!this.data.isTimerPaused) {
      const timer = setInterval(() => {
        const countdown = this.data.countdown - 1;
        if (countdown <= 0) {
          this.showNextRow();
          this.setData({ countdown: this.data.timerInterval });
        } else {
          this.setData({ countdown });
        }

      }, 1000);
      this.setData({ timer });

    }

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
          availableRows = [{ content: '你已经记住了所有的内容！' }]

        }
      }
    }
    else {
      if (rememberedData && rememberedData.data.length >= 0) {
        availableRows = rememberedData.data;
        if (availableRows.length === 0) {
          availableRows = [{ content: '你还没有已记住的内容！' }]

        }
      }
    }

    let nextIndex = 0
    if (this.data.playMode === 'random') {
      nextIndex = Math.floor(Math.random() * availableRows.length);
    }
    else {
      nextIndex = this.data.currentIndex + 1
      if (nextIndex >= availableRows.length) {
        nextIndex = 0
      }
    }

    let row = availableRows[nextIndex];
    const rowContent = Object.values(row).filter(value => value !== row.index).map(value => String(value));
    console.log(rowContent)
    this.setData({
      currentRow: rowContent,
      row: row,
      currentIndex: nextIndex
    });
  },

  onLongPress() {
    if (!this.data.isSettingsOpen) {
      this.setData({ isPressing: true });
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

  onContentTap() {
    const newPausedState = !this.data.isTimerPaused;
    this.setData({
      isTimerPaused: newPausedState
    });


    if (this.data.isTimerPaused) {
      this.clearTimer();
    }
    else {
      this.startTimer()
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
      rememberedData.data.sort((a, b) => a.index - b.index);
      wx.setStorageSync(`${this.data.name}_remembered`, rememberedData);
      console.log(remainingData)
      console.log(rememberedData)
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
      remainingData.data.sort((a, b) => a.index - b.index);
      wx.setStorageSync(`${this.data.name}_remaining`, remainingData);
    }

    this.showNextRow();
    this.startTimer();
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


  // 更新卡片数量
  updateCardCount() {
    const cards = wx.getStorageSync(`${this.data.name}_cards`) || [];
    console.log(cards.length)
    this.setData({
      cardCount: cards.length
    });
    console.log(this.data)
  },

  // 跳转到卡片页面
  navigateToCardPage() {
    wx.navigateTo({
      url: `/pages/card/card?name=${encodeURIComponent(this.data.name)}`
    });
  },

  // 添加当前 item 到卡片
  addCurrentItemToCard() {
    console.log(this.data)
    if (this.data.currentIndex<0) {
      wx.showToast({
        title: '没有可添加的项目',
        icon: 'none'
      });
      return;
    }

    const cards = wx.getStorageSync(`${this.data.name}_cards`) || [];
    
    cards.push({
      content: this.data.currentRow,
      createTime: new Date().toISOString()
    });
    wx.setStorageSync(`${this.data.name}_cards`, cards);
    
    this.updateCardCount();
    
    wx.showToast({
      title: '已添加到卡片',
      icon: 'success'
    });
  },

}); 