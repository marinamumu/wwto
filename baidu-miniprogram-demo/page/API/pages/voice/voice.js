var wx = swan;

if (!wx['has_hook_flag']) {
  wx['has_hook_flag'] = true;
  let getStorageSyncBak = swan['getStorageSync'];
  wx['getStorageSync'] = (key) => {
    const val = getStorageSyncBak(key);
    if (val === 'undefined') {
      return '';
    }
    return val;
  };

  let requestBak = wx.request;
  wx.request = (opt) => {
    // 方法名必须大写
    if (opt.method) {
      opt.method = opt.method.toUpperCase();
    }

    // post请求会将数据序列化，字符串序列化会前后多一个双引号导致后端接口异常
    // TOO 还需要对返回结果处理
    if (opt.method === 'POST' && typeof opt.data === 'string') {
      opt.header = opt.header || {};
      opt.header['content-type'] = 'application/x-www-form-urlencoded';
    }

    requestBak(opt);
  };
}const util = require('../../../../util/util.js')

let playTimeInterval
let recordTimeInterval

Page({
  onShareAppMessage() {
    return {
      title: '录音',
      path: 'page/API/pages/voice/voice'
    }
  },

  data: {
    recording: false,
    playing: false,
    hasRecord: false,
    recordTime: 0,
    playTime: 0,
    formatedRecordTime: '00:00:00',
    formatedPlayTime: '00:00:00'
  },

  onHide() {
    if (this.data.playing) {
      this.stopVoice()
    } else if (this.data.recording) {
      this.stopRecordUnexpectedly()
    }
  },

  startRecord() {
    this.setData({recording: true})

    const that = this
    recordTimeInterval = setInterval(function () {
      const recordTime = that.data.recordTime += 1
      that.setData({
        formatedRecordTime: util.formatTime(that.data.recordTime),
        recordTime
      })
    }, 1000)

    wx.startRecord({
      success(res) {
        that.setData({
          hasRecord: true,
          tempFilePath: res.tempFilePath,
          formatedPlayTime: util.formatTime(that.data.playTime)
        })
      },
      complete() {
        that.setData({recording: false})
        clearInterval(recordTimeInterval)
      }
    })
  },

  stopRecord() {
    wx.stopRecord()
  },

  stopRecordUnexpectedly() {
    const that = this
    wx.stopRecord({
      success() {
        console.log('stop record success')
        clearInterval(recordTimeInterval)
        that.setData({
          recording: false,
          hasRecord: false,
          recordTime: 0,
          formatedRecordTime: util.formatTime(0)
        })
      }
    })
  },

  playVoice() {
    const that = this
    playTimeInterval = setInterval(function () {
      const playTime = that.data.playTime + 1
      console.log('update playTime', playTime)
      that.setData({
        playing: true,
        formatedPlayTime: util.formatTime(playTime),
        playTime
      })
    }, 1000)
    wx.playVoice({
      filePath: this.data.tempFilePath,
      success() {
        clearInterval(playTimeInterval)
        const playTime = 0
        console.log('play voice finished')
        that.setData({
          playing: false,
          formatedPlayTime: util.formatTime(playTime),
          playTime
        })
      }
    })
  },

  pauseVoice() {
    clearInterval(playTimeInterval)
    wx.pauseVoice()
    this.setData({
      playing: false
    })
  },

  stopVoice() {
    clearInterval(playTimeInterval)
    this.setData({
      playing: false,
      formatedPlayTime: util.formatTime(0),
      playTime: 0
    })
    wx.stopVoice()
  },

  clear() {
    clearInterval(playTimeInterval)
    wx.stopVoice()
    this.setData({
      playing: false,
      hasRecord: false,
      tempFilePath: '',
      formatedRecordTime: util.formatTime(0),
      recordTime: 0,
      playTime: 0
    })
  }
})
