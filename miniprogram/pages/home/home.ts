interface FileItem {
  name: string;
  path: string;
  uploadTime: string;
  total: number;
  rememberedCount?: number;
}

interface IPageData {
  fileList: FileItem[];
}

Page<IPageData>({
  data: {
    fileList: [] as FileItem[]
  },

  onLoad() {
    const fileList = wx.getStorageSync('files') || [];
    console.log(fileList)
    this.setData({ fileList });
  },

  // 将文件转换为base64
  async fileToBase64(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: res => resolve(res.data as string),
        fail: err => reject(err)
      });
    });
  },

  // 调用云函数API
  async parseExcel(base64Data: string) {
    try {
      console.log('开始调用云函数');
      return new Promise((resolve, reject) => {
        wx.request({
          url: 'https://1253478402-84nfgh5h14.ap-shanghai.tencentscf.com',
          method: 'POST',
          data: {
            body: base64Data
          },
          header: {
            'content-type': 'application/json'
          },
          timeout: 30000,
          success: (response: any) => {
            console.log('云函数完整响应：', response);
            if (response.statusCode === 200) {
              try {
                // 尝试解析响应数据
                const result = typeof response.data === 'string' 
                  ? JSON.parse(response.data) 
                  : response.data;
                console.log('解析后的响应数据：', result);
                resolve(result);
              } catch (error) {
                console.error('响应数据解析失败：', error);
                reject(new Error('响应数据解析失败'));
              }
            } else {
              console.error('API响应状态码错误：', response.statusCode);
              reject(new Error(`API请求失败: ${response.statusCode}`));
            }
          },
          fail: (error) => {
            console.error('请求失败：', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('API调用错误：', error);
      throw error;
    }
  },
  async chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'all',
      extension: ['.xlsx', '.xls'],
      success: async (res) => {
        const file = res.tempFiles[0];
        
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
          wx.showToast({
            title: '请选择Excel文件',
            icon: 'none'
          });
          return;
        }

        if(this.data.fileList.some(item => item.name === file.name)) {
          wx.showToast({
            title: '不支持同名文件，请重命名并重试',
            icon: 'none'
          });
          return;
        }

        wx.showLoading({ 
          title: '正在解析文件...',
          mask: true
        });

        try {
          const base64Data = await this.fileToBase64(file.path);
          const parsedData = await this.parseExcel(base64Data);
          console.log(parsedData)
          
          // 保存 JSON 到本地存储
          wx.setStorageSync(`${file.name}_remaining`, parsedData);
          wx.setStorageSync(`${file.name}_remembered`, {data:[]})

          const newFile: FileItem = {
            name: file.name,
            path: file.path,
            uploadTime: new Date().toLocaleString(),
            total: parsedData.data.length,
          };

          const fileList = [...this.data.fileList, newFile];
          console.log(fileList)
          this.setData({ fileList });
          wx.setStorageSync('files', fileList);

          wx.hideLoading();
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } catch (error) {
          wx.hideLoading();
          wx.showToast({
            title: '解析失败',
            icon: 'error'
          });
          console.error('文件处理错误：', error);
        }
      },
      fail: () => {
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        });
      }
    });
  },
  
  goToRememberPage(e: any) {
    const file = e.currentTarget.dataset.file;
    wx.navigateTo({
      url: `/pages/remember/remember?name=${encodeURIComponent(file.name)}&fileName=${encodeURIComponent(file.name)}`
    });
  },
  

  updateFileList() {
    const fileList = wx.getStorageSync('files') || [];
    
    // 更新每个文件的记忆进度
    const updatedFileList = fileList.map(file => {
      try {
        // 获取文件的原始数据
        const remainingData = wx.getStorageSync(`${file.name}_remaining`);
        const rememberedData = wx.getStorageSync(`${file.name}_remembered`);
        // 计算总数和已记住的数量
        
        const rememberedCount = Array.isArray(rememberedData.data) ? rememberedData.data.length : 0;
        
        console.log('File:', file.name, 'Total:', file.total, 'Remembered:', rememberedCount); // 调试日志
        console.log(remainingData)
        console.log(rememberedData)
        return {
          ...file,
          rememberedCount: rememberedCount
        };
      } catch (error) {
        console.error('更新文件进度失败：', file.name, error);
        // 如果出错，至少保持原有的数据结构
        return {
          ...file,
          rememberedCount: 0
        };
      }
    });
    
    console.log('Updated file list:', updatedFileList); // 调试日志

    this.setData({ fileList: updatedFileList });
  },

  onShow() {
    // 每次显示页面时更新列表
    this.updateFileList();
  },

  showDeleteConfirm(e: any) {
    const file = e.currentTarget.dataset.file;
    if (!file || !file.name) {
      console.error('文件名未找到', file);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `是否删除「${file.name.replace(/\.(xlsx|xls)$/i, '')}」？`,
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          try {
            // 删除存储的数据
            wx.removeStorageSync(`${file.name}_remaining`);
            wx.removeStorageSync(`${file.name}_remembered`);
            
            // 从文件列表中移除
            const fileList = this.data.fileList.filter(
              item => item.name !== file.name
            );
            
            // 更新状态和存储
            wx.setStorageSync('files', fileList);
            this.updateFileList();
            
            wx.showToast({
              title: '已删除',
              icon: 'success'
            });
          } catch (error) {
            console.error('删除操作失败：', error);
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '总会记住',
      path: '/pages/home/home'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '总会记住'
    }
  }
}); 