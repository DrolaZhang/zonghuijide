Page({
  data: {
    name: '',
    cards: [],
    cardCount: 0,
    newCardContent: '',
    selectedCards: {},
    hasSelectedCards: false,
    generatedCardPath: ''
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
    const cards = wx.getStorageSync(`${this.data.name}_cards`) || [];
    this.setData({
      cards,
      cardCount: cards.length,
      selectedCards: {}
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
    const selectedCards = { ...this.data.selectedCards };
    
    // 切换选中状态
    selectedCards[index] = !selectedCards[index];
    
    // 更新选中状态
    this.setData({
      selectedCards: selectedCards,
      hasSelectedCards: Object.values(selectedCards).some(value => value)
    });
  },

  // 删除选中的卡片
  deleteSelectedCards() {
    console.log('delete funtion called')
    const selectedIndexes = Object.keys(this.data.selectedCards)
      .filter(index => this.data.selectedCards[index])
      .map(Number);
      
    if (selectedIndexes.length === 0) return;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedIndexes.length} 个卡片吗？`,
      success: (res) => {
        if (res.confirm) {
          const cards = this.data.cards.filter((_, i) => !selectedIndexes.includes(i));
          wx.setStorageSync(`${this.data.name}_cards`, cards);
          
          this.setData({
            cards,
            cardCount: cards.length,
            selectedCards: {},
            hasSelectedCards: false
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
    const selectedIndexes = Object.keys(this.data.selectedCards)
      .filter(index => this.data.selectedCards[index])
      .map(Number);
      
    if (selectedIndexes.length === 0) return;

    wx.showLoading({
      title: '生成中...',
    });

    const selectedContents = selectedIndexes
      .map(index => this.data.cards[index].content);

    const query = wx.createSelectorQuery();
    query.select('#cardCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = 750 * dpr;
        canvas.height = 1000 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // 绘制背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 750, 1000);

        // 根据选择的数量确定布局
        const layout = this.getLayout(selectedContents.length);
        
        // 计算每个卡片的位置和大小
        const cardWidth = 750 / layout.cols;
        const cardHeight = 1000 / layout.rows;

        // 绘制每个卡片
        selectedContents.forEach((content, index) => {
          const row = Math.floor(index / layout.cols);
          const col = index % layout.cols;
          const x = col * cardWidth;
          const y = row * cardHeight;

          // 绘制卡片背景
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(x, y, cardWidth, cardHeight);

          // 绘制卡片边框
          ctx.strokeStyle = '#ddd';
          ctx.strokeRect(x, y, cardWidth, cardHeight);

          // 绘制卡片内容
          ctx.font = '24px sans-serif';
          ctx.fillStyle = '#333';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          
          // 计算文本位置
          const centerX = x + cardWidth / 2;
          const centerY = y + cardHeight / 2;
          
          // 只显示 value 值
          // const value = content;
          // ctx.fillText(value, centerX, centerY);


          const values = Object.values(content);
          const lineHeight = 30;
          const startY = centerY - (values.length * lineHeight) / 2;

          values.forEach((value, i) => {
            ctx.fillText(value, centerX, startY + i * lineHeight);
          });

        });

        wx.canvasToTempFilePath({
          canvas,
          success: (res) => {
            this.setData({
              generatedCardPath: res.tempFilePath
            });
            wx.hideLoading();
          },
          fail: (error) => {
            console.error('生成卡片失败:', error);
            wx.hideLoading();
            wx.showToast({
              title: '生成失败',
              icon: 'none'
            });
          }
        });
      });
  },

  // 关闭预览
  closePreview() {
    this.setData({
      generatedCardPath: ''
    });
  },

  // 根据数量获取布局配置
  getLayout(count) {
    const layouts = {
      1: { rows: 1, cols: 1 },
      2: { rows: 2, cols: 1 },
      3: { rows: 3, cols: 1 },
      4: { rows: 2, cols: 2 },
      5: { rows: 3, cols: 2 },
      6: { rows: 3, cols: 2 },
      7: { rows: 3, cols: 3 },
      8: { rows: 4, cols: 2 },
      9: { rows: 3, cols: 3 },
      10: { rows: 5, cols: 2 }
    };
    return layouts[count] || layouts[10];
  },

  // 保存到相册
  saveToAlbum() {
    wx.showLoading({
      title: '保存中...',
    });

    wx.saveImageToPhotosAlbum({
      filePath: this.data.generatedCardPath,
      success: () => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('保存失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  }
});
