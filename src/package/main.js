/**
 * Created by TY-xie on 2018/3/29.
 */
import './index.less'
import {css, getParentByClassName, isMobile, getObjectURL, dataURLtoBlob} from './dom'
import cropImage from './CropperAction'
import request from './request'

const cropperOptions = {
  viewMode: 1,
  dragMode: 'move',
  center: false,
  zoomOnWheel: true,
  movable: true,
  resizable: true,
  autoCropArea: 1,
  minContainerWidth: '100%',
  background: true,
}
const defaultOptions = {
  width: 100,
  height: 100,
  MIME: 'png',
  blob: false,
  uploadUrl: '/yunhuiyuan/UploadFile/UploadSingleImage?isCompress=true',
  fileName: 'imgFile',
}

class EmitAble {
  task = {}

  on(event, callback) {
	this.task[event] = callback
  }

  fire(event, payload) {
	this.task[event] && this.task[event](payload)
  }
}

export default class ImageUploader extends EmitAble {
  rowData = null
  rowUrl = null

  constructor(opt) {
	super()
	this.$options = {
	  ...defaultOptions,
	  cropperOptions: {
		...cropperOptions,
		...(opt.cropperOptions || {}),
	  },
	  ...opt,
	}
  }

  // 图片载入完成,显示截图框
  showCropper = (url) => {
	if (!url) return false
	this.rowUrl = url
	cropImage({
	  url,
	  isMobile,
	  ...this.$options,
	})
		.then(res => {
		  this.fire('crop', res)
		  this.uploadImage(res)
		})
		.catch(e => {
		  this.fire('error', e)
		})
  }

  // 提供给实例用于加载input的文件
  uploadFile = (e) => {
	let files = e.target.files || e.dataTransfer.files
	if (!files.length) return false
	if (!files[0].type.includes('image')) {
	  return false
	}
	this.rowData = files[0]
	this.showCropper(getObjectURL(this.rowData))
  }

  // 将图片上传后台
  uploadImage = async (img) => {
	if (this.$options.upload) {
	  this.$options.upload(img, (err, res) => {
		err ? this.fire('upload-error', err) : this.fire('upload', res)
	  })
	  return
	}
	try {
	  let form = new FormData()
	  let blob = this.$options.blob ? img : dataURLtoBlob(img)
	  form.append(this.$options.fileName, blob, Date.now() + '.' + this.$options.MIME)
	  let res = await request(this.$options.url, form)
	  this.fire('upload', res)
	} catch (e) {
	  this.fire('upload-error', e)
	}
  }

  static isMobile = isMobile
  static getObjectUrl = getObjectURL
  static dataURLtoBlob = dataURLtoBlob
}
