Page({
  data: {
    name: '',
    cards: [],
    cardCount: 0,
    newCardContent: '',
    selectedIndex: -1
  },

  onLoad(options: Record<string, string>) {
    if (options.name) {
      const name = decodeURIComponent(options.name);
      this.setData({ name });
    }
    this.loadCards();
  },

  // 加载卡片数据
  loadCards() {
    console.log(this.data.name)
    const cards = wx.getStorageSync(`${this.data.name}_cards`) || [];
    console.log(cards)
    this.setData({
      cards,
      cardCount: cards.length
    });
  },

  // 输入内容变化
  onInputChange(e) {
    this.setData({
      newCardContent: e.detail.value
    });
  },

  // 添加卡片
  addCard() {
    if (!this.data.newCardContent.trim()) return;

    const cards = [...this.data.cards, {
      content: this.data.newCardContent,
      createTime: new Date().toISOString()
    }];

    wx.setStorageSync(`${this.data.name}_cards`, cards);
    this.setData({
      cards,
      cardCount: cards.length,
      newCardContent: ''
    });

    // 更新 remember 页面的卡片数量
    const pages = getCurrentPages();
    const rememberPage = pages.find(page => page.route === `pages/remember/remember?name=${encodeURIComponent(this.data.name)}`);
    if (rememberPage) {
      rememberPage.updateCardCount();
    }
  },

 

  // 选择卡片
  selectCard(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedIndex: index
    });
  },

  // 删除选中的卡片
  deleteSelectedCard() {
    if (this.data.selectedIndex === -1) return;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除选中的卡片吗？',
      success: (res) => {
        if (res.confirm) {
          const cards = this.data.cards.filter((_, i) => i !== this.data.selectedIndex);
          wx.setStorageSync(`${this.data.name}_cards`, cards);
          console.log(cards)
          this.setData({
            cards,
            cardCount: cards.length,
            selectedIndex: -1
          });

          // 更新 remember 页面的卡片数量
          const pages = getCurrentPages();
          const rememberPage = pages.find(page => page.route === 'pages/remember/remember');
          if (rememberPage) {
            rememberPage.updateCardCount();
          }

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 生成卡片
  generateCard() {
    if (this.data.selectedIndex === -1) return;

    const selectedCard = this.data.cards[this.data.selectedIndex];
    
    // 这里可以添加生成卡片的具体逻辑
    // 例如：保存到相册、分享等
    
    wx.showToast({
      title: '生成成功',
      icon: 'success'
    });
  }
});
