interface FileItem {
  name: string;
  path: string;
  uploadTime: string;
  jsonName: string;
  data: {
    total: number;
    rows: any[];
  };
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
    const fileList = wx.getStorageSync('excelFiles') || [];
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
      type: 'file',
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

        wx.showLoading({ 
          title: '正在解析文件...',
          mask: true
        });

        try {
          const base64Data = await this.fileToBase64(file.path);
          const parsedData = await this.parseExcel(base64Data);
          
          // 获取文件名（去除后缀）
          const jsonName = file.name.replace(/\.(xlsx|xls)$/i, '');
          
          // 保存 JSON 到本地存储
          wx.setStorageSync(jsonName, parsedData);

          const newFile: FileItem = {
            name: file.name,
            path: file.path,
            uploadTime: new Date().toLocaleString(),
            jsonName,
            data: parsedData
          };

          const fileList = [...this.data.fileList, newFile];
          this.setData({ fileList });
          wx.setStorageSync('excelFiles', fileList);

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

  viewFile(e: any) {
    const file = e.currentTarget.dataset.file;
    if (file.data) {
      // 如果有解析数据，显示解析结果
      console.log('解析结果：', file.data);
      wx.showModal({
        title: '文件内容',
        content: `共${file.data.total}行数据`,
        showCancel: false
      });
    } else {
      // 否则打开文件预览
      wx.openDocument({
        filePath: file.path,
        showMenu: true,
        success: () => {
          console.log('打开文档成功');
        },
        fail: () => {
          wx.showToast({
            title: '无法打开文件',
            icon: 'error'
          });
        }
      });
    }
  },

  deleteFile(e: any) {
    const file = e.currentTarget.dataset.file;
    wx.showModal({
      title: '确认删除',
      content: `是否删除文件 ${file.name}？`,
      success: (res) => {
        if (res.confirm) {
          try {
            // 删除本地存储的JSON数据
            wx.removeStorageSync(file.jsonName);
            
            // 从文件列表中移除
            const fileList = this.data.fileList.filter(
              item => item.jsonName !== file.jsonName
            );
            
            // 更新状态和存储
            this.setData({ fileList });
            wx.setStorageSync('excelFiles', fileList);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
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

  // 跳转到随机显示页面
  goToRandomView(e: any) {
    const file = e.currentTarget.dataset.file;
    wx.navigateTo({
      url: `/pages/random/random?jsonName=${encodeURIComponent(file.jsonName)}`,
      fail: (err) => {
        console.error('页面跳转失败：', err);
      }
    });
  },

  async processExcelFile(filePath: string, fileName: string) {
    try {
      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      // 读取文件为 base64
      const fileData = await new Promise((resolve, reject) => {
        wx.getFileSystemManager().readFile({
          filePath: filePath,
          encoding: 'base64',
          success: res => resolve(res.data as string),
          fail: err => reject(err)
        });
      });

      // 调用云函数解析 Excel
      const parsedData = await this.parseExcel(fileData);

      // 去掉文件扩展名作为 jsonName
      const jsonName = fileName.replace(/\.(xlsx|xls)$/i, '');

      // 创建新的文件记录
      const newFile: FileItem = {
        name: fileName,
        path: filePath,
        uploadTime: new Date().toLocaleString(),
        jsonName: jsonName,
        data: {
          total: parsedData.length,
          rows: parsedData
        },
        rememberedCount: 0
      };

      // 保存解析后的数据
      wx.setStorageSync(jsonName, parsedData);
      
      // 获取现有文件列表并添加新文件
      const existingFiles = wx.getStorageSync('excelFiles') || [];
      const updatedFiles = [newFile, ...existingFiles];
      
      // 保存文件列表
      wx.setStorageSync('excelFiles', updatedFiles);
      
      // 初始化已记住的数据
      wx.setStorageSync(`${jsonName}_remembered`, []);
      
      // 更新页面显示
      this.updateFileList();
      
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });

    } catch (error) {
      console.error('处理文件失败：', error);
      wx.showToast({
        title: '处理失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  updateFileList() {
    const fileList = wx.getStorageSync('excelFiles') || [];
    
    // 更新每个文件的记忆进度
    const updatedFileList = fileList.map(file => {
      const rememberedData = wx.getStorageSync(`${file.jsonName}_remembered`) || [];
      return {
        ...file,
        rememberedCount: rememberedData.length
      };
    });
    
    this.setData({ fileList: updatedFileList });
  },

  showDeleteConfirm(e: any) {
    const file = e.currentTarget.dataset.file;
    if (!file || !file.jsonName) {
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
            wx.removeStorageSync(file.jsonName);
            wx.removeStorageSync(`${file.jsonName}_remembered`);
            
            // 从文件列表中移除
            const fileList = this.data.fileList.filter(
              item => item.jsonName !== file.jsonName
            );
            
            // 更新状态和存储
            wx.setStorageSync('excelFiles', fileList);
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
  }
}); 