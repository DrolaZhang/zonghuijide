interface IPageData {
  name: string;
  cards: any[];
  cardCount: number;
  newCardContent: string;
  selectedCards: any;
  hasSelectedCards: boolean;
  generatedCardPath: string;
  markdownText: string;
  previewImage: string;
  isPreviewVisible: boolean;
}

Page<IPageData>({
  data: {
    name: '',
    cards: [],
    cardCount: 0,
    newCardContent: '',
    selectedCards: {},
    hasSelectedCards: false,
    generatedCardPath: '',
    markdownText: '',
    previewImage: '',
    isPreviewVisible: false
  },

  onLoad(options: Record<string, string>) {
    if (options.name) {
      const name = decodeURIComponent(options.name);
      this.setData({ name });
    }
    this.loadCards();
  },
  onInput(e: any): void {
    this.setData({
      markdownText: e.detail.value
    });
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

  // 生成卡片
  async generateCard(): Promise<void> {
    if (!this.data.markdownText.trim()) {
      wx.showToast({
        title: '请输入Markdown文本',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '生成中...'
    });

    try {
      console.log('开始创建画布...');
      const query = wx.createSelectorQuery();
      const canvas = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
        query.select('#cardCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            console.log('Canvas查询结果:', res);
            if (!res[0] || !res[0].node) {
              console.error('Canvas节点未找到');
              wx.showToast({
                title: '创建画布失败',
                icon: 'none'
              });
              return;
            }
            console.log('Canvas节点创建成功');
            const canvas = res[0].node;
            resolve(canvas);
          });
      });

      if (!canvas) {
        console.error('Canvas对象为空');
        wx.hideLoading();
        return;
      }

      console.log('开始获取Canvas上下文...');
      const ctx = canvas.getContext('2d');
      console.log('Canvas上下文获取成功');

      const dpr = wx.getSystemInfoSync().pixelRatio;
      console.log('设备像素比:', dpr);
      canvas.width = 750 * dpr;
      canvas.height = 1000 * dpr;
      ctx.scale(dpr, dpr);

      // 设置背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 750, 1000);

      // 解析Markdown文本
      const lines = this.data.markdownText.split('\n');
      let y = 60;
      const lineHeight = 48;
      const padding = 40;
      const maxWidth = 750 - padding * 2;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') {
          y += lineHeight;
          continue;
        }

        // 处理标题
        if (line.startsWith('# ')) {
          ctx.font = 'bold 40px sans-serif';
          ctx.fillStyle = '#333333';
          const text = line.substring(2);
          const words = text.split(' ');
          let x = padding;
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth - 40) {
              ctx.fillText(currentLine, x, y);
              currentLine = word + ' ';
              x = padding;
              y += lineHeight;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            ctx.fillText(currentLine, x, y);
          }
          y += lineHeight * 1.5;
          continue;
        }
        if (line.startsWith('## ')) {
          ctx.font = 'bold 36px sans-serif';
          ctx.fillStyle = '#333333';
          const text = line.substring(3);
          const words = text.split(' ');
          let x = padding;
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth - 40) {
              ctx.fillText(currentLine, x, y);
              currentLine = word + ' ';
              x = padding;
              y += lineHeight;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            ctx.fillText(currentLine, x, y);
          }
          y += lineHeight * 1.3;
          continue;
        }
        if (line.startsWith('### ')) {
          ctx.font = 'bold 32px sans-serif';
          ctx.fillStyle = '#333333';
          const text = line.substring(4);
          const words = text.split(' ');
          let x = padding;
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth - 40) {
              ctx.fillText(currentLine, x, y);
              currentLine = word + ' ';
              x = padding;
              y += lineHeight;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            ctx.fillText(currentLine, x, y);
          }
          y += lineHeight * 1.2;
          continue;
        }

        // 处理引用
        if (line.startsWith('> ')) {
          ctx.font = '32px sans-serif';
          // 绘制引用线
          ctx.beginPath();
          ctx.moveTo(padding - 5, y - 5);
          ctx.lineTo(padding - 5, y + lineHeight + 5);
          ctx.strokeStyle = '#4a90e2';
          ctx.lineWidth = 2;
          ctx.stroke();
          // 绘制引用文本
          const text = line.substring(2);
          const words = text.split(' ');
          let x = padding + 20;
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth - 60) { // 减去左右边距和引用线间距
              ctx.fillStyle = '#666666';
              ctx.fillText(currentLine, x, y);
              currentLine = word + ' ';
              x = padding + 20;
              y += lineHeight;
              // 继续绘制引用线
              ctx.beginPath();
              ctx.moveTo(padding - 5, y - 5);
              ctx.lineTo(padding - 5, y + lineHeight + 5);
              ctx.strokeStyle = '#4a90e2';
              ctx.lineWidth = 2;
              ctx.stroke();
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            ctx.fillStyle = '#666666';
            ctx.fillText(currentLine, x, y);
          }
          y += lineHeight + 10;
          continue;
        }

        // 处理加粗文本
        if (line.includes('**')) {
          const parts = line.split('**');
          let x = padding;
          let currentLine = '';
          let isBold = false;
          
          for (let j = 0; j < parts.length; j++) {
            const text = parts[j];
            const words = text.split(' ');
            
            for (const word of words) {
              ctx.font = isBold ? 'bold 32px sans-serif' : '32px sans-serif';
              const testLine = currentLine + word + ' ';
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth - 40) {
                ctx.fillStyle = '#333333';
                ctx.fillText(currentLine, x, y);
                currentLine = word + ' ';
                x = padding;
                y += lineHeight;
              } else {
                currentLine = testLine;
              }
            }
            isBold = !isBold;
          }
          if (currentLine) {
            ctx.fillStyle = '#333333';
            ctx.fillText(currentLine, x, y);
          }
          y += lineHeight;
          continue;
        }

        // 处理斜体文本
        if (line.includes('*')) {
          const parts = line.split('*');
          let x = padding;
          let currentLine = '';
          let isItalic = false;
          
          for (let j = 0; j < parts.length; j++) {
            const text = parts[j];
            const words = text.split(' ');
            
            for (const word of words) {
              ctx.font = isItalic ? 'italic 32px sans-serif' : '32px sans-serif';
              const testLine = currentLine + word + ' ';
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth - 40) {
                ctx.fillStyle = '#333333';
                ctx.fillText(currentLine, x, y);
                currentLine = word + ' ';
                x = padding;
                y += lineHeight;
              } else {
                currentLine = testLine;
              }
            }
            isItalic = !isItalic;
          }
          if (currentLine) {
            ctx.fillStyle = '#333333';
            ctx.fillText(currentLine, x, y);
          }
          y += lineHeight;
          continue;
        }

        // 处理列表
        if (line.startsWith('- ')) {
          ctx.font = '32px sans-serif';
          ctx.fillStyle = '#666666';
          ctx.fillText('•', padding, y);
          const text = line.substring(2);
          const words = text.split(' ');
          let x = padding + 30;
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth - 70) { // 减去左边距和项目符号间距
              ctx.fillText(currentLine, x, y);
              currentLine = word + ' ';
              x = padding + 30;
              y += lineHeight;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            ctx.fillText(currentLine, x, y);
          }
          y += lineHeight;
          continue;
        }

        // 处理数字列表
        if (/^\d+\.\s/.test(line)) {
          ctx.font = '32px sans-serif';
          ctx.fillStyle = '#666666';
          const match = line.match(/^(\d+)\.\s/);
          if (match) {
            const number = match[1];
            ctx.fillText(number + '.', padding, y);
            const text = line.substring(match[0].length);
            const words = text.split(' ');
            let x = padding + 40;
            let currentLine = '';
            
            for (const word of words) {
              const testLine = currentLine + word + ' ';
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth - 80) { // 减去左边距和数字间距
                ctx.fillText(currentLine, x, y);
                currentLine = word + ' ';
                x = padding + 40;
                y += lineHeight;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              ctx.fillText(currentLine, x, y);
            }
          }
          y += lineHeight;
          continue;
        }

        // 处理分割线
        if (line === '---' || line === '***') {
          ctx.beginPath();
          ctx.moveTo(padding, y);
          ctx.lineTo(750 - padding, y);
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 5;
          ctx.stroke();
          y += lineHeight  ; // 增加下方间距
          continue;
        }

        // 处理代码块
        if (line.startsWith('```')) {
          const code = line.substring(3);
          // 绘制代码块背景
          ctx.fillStyle = '#f6f8fa';
          ctx.fillRect(padding - 10, y - 10, maxWidth + 20, lineHeight + 20);
          // 绘制代码文本
          ctx.font = '28px monospace';
          ctx.fillStyle = '#24292e';
          const words = code.split(' ');
          let x = padding;
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth - 40) {
              ctx.fillText(currentLine, x, y);
              currentLine = word + ' ';
              x = padding;
              y += lineHeight;
              // 继续绘制代码块背景
              ctx.fillStyle = '#f6f8fa';
              ctx.fillRect(padding - 10, y - 10, maxWidth + 20, lineHeight + 20);
              ctx.fillStyle = '#24292e';
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            ctx.fillText(currentLine, x, y);
          }
          y += lineHeight + 10;
          continue;
        }

        // 处理普通文本
        ctx.font = '32px sans-serif';
        const words = line.split(' ');
        let x = padding;
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth - 40) {
            ctx.fillStyle = '#333333';
            ctx.fillText(currentLine, x, y);
            currentLine = word + ' ';
            x = padding;
            y += lineHeight;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          ctx.fillStyle = '#333333';
          ctx.fillText(currentLine, x, y);
        }
        y += lineHeight;
      }

      // 将canvas转换为图片
      const tempFilePath = await new Promise<string>((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        });
      });

      this.setData({
        previewImage: tempFilePath,
        isPreviewVisible: true
      });

      wx.hideLoading();
      wx.showToast({
        title: '生成成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('生成卡片失败：', error);
      wx.hideLoading();
      wx.showToast({
        title: '生成失败',
        icon: 'error'
      });
    }
  },

  // 关闭预览
  closePreview() {
    this.setData({
      isPreviewVisible: false
    });
  },
  saveImage(): void {
    if (!this.data.previewImage) {
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.previewImage,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
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
  },

  showPreview(): void {
    this.setData({
      isPreviewVisible: true
    });
  },

  preventBubble(): void {
    // 阻止事件冒泡
  }
});
