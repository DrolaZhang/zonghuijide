interface FileItem {
  name: string;
  uploadTime: string;
  path: string;
  data?: any; // 存储解析后的JSON数据
}

interface IPageData {
  fileList: FileItem[];
}

Page<IPageData>({
  data: {
    fileList: []
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
        wx.showLoading({ title: '正在解析文件...' });

        try {
          // 将文件转换为base64
          const base64Data = await this.fileToBase64(file.path);
          
          // 调用API解析Excel
          const parsedData = await this.parseExcel(base64Data);

          const newFile: FileItem = {
            name: file.name,
            path: file.path,
            uploadTime: new Date().toLocaleString(),
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
          const fileList = this.data.fileList.filter(
            item => item.name !== file.name
          );
          this.setData({ fileList });
          wx.setStorageSync('excelFiles', fileList);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  }
}); 