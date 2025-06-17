// diary.ts
interface IDiary {
  id: string;
  text: string;
  images: string[];
  audio?: string;
  video?: string;
  time: string;
}

interface IPageData {
  currentDate: string;
  diaries: IDiary[];
  showModal: boolean;
  newDiary: {
    text: string;
    images: string[];
    audio?: string;
    video?: string;
  };
}

Page<IPageData>({
  data: {
    currentDate: '',
    diaries: [],
    showModal: false,
    newDiary: {
      text: '',
      images: [],
      audio: undefined,
      video: undefined
    }
  },

  onLoad() {
    this.setCurrentDate();
    this.loadDiaries();
  },

  setCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    this.setData({
      currentDate: `${year}年${month}月${day}日`
    });
  },

  loadDiaries() {
    const diaries = wx.getStorageSync('diaries') || [];
    this.setData({ diaries });
  },

  showAddModal() {
    this.setData({
      showModal: true,
      newDiary: {
        text: '',
        images: [],
        audio: undefined,
        video: undefined
      }
    });
  },

  hideModal() {
    this.setData({ showModal: false });
  },

  preventBubble() {
    // 阻止事件冒泡
  },

  onTextInput(e: any) {
    this.setData({
      'newDiary.text': e.detail.value
    });
  },

  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });

      const newImages = [...this.data.newDiary.images, ...res.tempFiles.map(file => file.tempFilePath)];
      this.setData({
        'newDiary.images': newImages
      });
    } catch (error) {
      console.error('选择图片失败:', error);
    }
  },

  async chooseAudio() {
    try {
      const res = await wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['mp3', 'wav']
      });

      this.setData({
        'newDiary.audio': res.tempFiles[0].path
      });
    } catch (error) {
      console.error('选择音频失败:', error);
    }
  },

  async chooseVideo() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back'
      });

      this.setData({
        'newDiary.video': res.tempFiles[0].tempFilePath
      });
    } catch (error) {
      console.error('选择视频失败:', error);
    }
  },

  previewImage(e: any) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({
      urls,
      current
    });
  },

  saveDiary() {
    if (!this.data.newDiary.text.trim()) {
      wx.showToast({
        title: '请输入文字内容',
        icon: 'none'
      });
      return;
    }

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newDiary: IDiary = {
      id: Date.now().toString(),
      text: this.data.newDiary.text,
      images: this.data.newDiary.images,
      audio: this.data.newDiary.audio,
      video: this.data.newDiary.video,
      time
    };

    const diaries = [newDiary, ...this.data.diaries];
    this.setData({ diaries });
    wx.setStorageSync('diaries', diaries);

    this.hideModal();
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  }
}); 