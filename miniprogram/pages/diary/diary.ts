// diary.ts
interface IMedia {
  type: 'image' | 'video';
  url: string;
}

interface IDiary {
  id: string;
  text: string;
  media: IMedia[];
  audio?: string;
  audioDuration?: number;
  time: string;
}

interface IPageData {
  currentDate: string;
  diaries: IDiary[];
  showModal: boolean;
  newDiary: {
    text: string;
    media: IMedia[];
    audio?: string;
    audioDuration?: number;
  };
  isRecording: boolean;
  recordingTime: number;
  voiceWaveHeight: number;
  recorderManager: WechatMiniprogram.RecorderManager;
}

Page<IPageData>({
  data: {
    currentDate: '',
    diaries: [],
    showModal: false,
    newDiary: {
      text: '',
      media: [],
      audio: undefined,
      audioDuration: undefined
    },
    isRecording: false,
    recordingTime: 0,
    voiceWaveHeight: 20,
    recorderManager: wx.getRecorderManager()
  },

  onLoad() {
    this.setCurrentDate();
    this.loadDiaries();
    this.initRecorder();
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

  initRecorder() {
    const recorderManager = this.data.recorderManager;
    
    recorderManager.onStart(() => {
      console.log('录音开始');
      this.startRecordingTimer();
    });

    recorderManager.onStop((res) => {
      console.log('录音结束', res);
      this.stopRecordingTimer();
      if (res.duration > 0) {
        this.setData({
          'newDiary.audio': res.tempFilePath,
          'newDiary.audioDuration': Math.round(res.duration / 1000)
        });
      }
    });

    recorderManager.onError((res) => {
      console.error('录音错误:', res);
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      });
      this.stopRecordingTimer();
    });
  },

  startRecordingTimer() {
    let time = 0;
    const timer = setInterval(() => {
      time++;
      this.setData({
        recordingTime: time,
        voiceWaveHeight: 20 + Math.random() * 40
      });
    }, 1000);

    this.recordingTimer = timer;
  },

  stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = undefined;
    }
    this.setData({
      isRecording: false,
      recordingTime: 0,
      voiceWaveHeight: 20
    });
  },

  showAddModal() {
    this.setData({
      showModal: true,
      newDiary: {
        text: '',
        media: [],
        audio: undefined,
        audioDuration: undefined
      }
    });
  },

  hideModal() {
    if (this.data.isRecording) {
      this.stopRecording();
    }
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

  async chooseMedia() {
    try {
      const res = await wx.chooseMedia({
        count: 9,
        mediaType: ['image', 'video'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        camera: 'back',
        maxDuration: 60
      });

      const newMedia = res.tempFiles.map(file => ({
        type: file.tempFilePath.includes('video') ? 'video' : 'image',
        url: file.tempFilePath
      }));

      this.setData({
        'newDiary.media': [...this.data.newDiary.media, ...newMedia]
      });
    } catch (error) {
      console.error('选择媒体失败:', error);
    }
  },

  startVoiceInput() {
    if (this.data.isRecording) {
      this.stopRecording();
      return;
    }

    this.setData({ isRecording: true });
    this.data.recorderManager.start({
      duration: 60000, // 最长录音时间，单位ms
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    });
  },

  stopRecording() {
    this.data.recorderManager.stop();
  },

  playAudio(e: any) {
    const { src } = e.currentTarget.dataset;
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = src;
    innerAudioContext.play();
  },

  previewImage(e: any) {
    const { urls, current } = e.currentTarget.dataset;
    const imageUrls = urls.filter((item: IMedia) => item.type === 'image').map((item: IMedia) => item.url);
    wx.previewImage({
      urls: imageUrls,
      current
    });
  },

  saveDiary() {
    if (!this.data.newDiary.text.trim() && !this.data.newDiary.media.length && !this.data.newDiary.audio) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newDiary: IDiary = {
      id: Date.now().toString(),
      text: this.data.newDiary.text,
      media: this.data.newDiary.media,
      audio: this.data.newDiary.audio,
      audioDuration: this.data.newDiary.audioDuration,
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