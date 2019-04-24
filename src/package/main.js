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
  width: 100, // 截图输出尺寸
  height: 100,
  MIME: 'png', // 输出图片格式
  blob: false,  // 输出图片类型 (base64)
  uploadUrl: '/',
  fileName: 'imgFile',
  stop: true,
  getFormData: void 0,
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
	  ...opt,
	  cropperOptions: {
		...cropperOptions,
		...(opt.cropperOptions || {}),
	  },
	}
	if (opt.el && opt.el instanceof Element) {
	  this.insertDom()
	}
  }

  insertDom() {
	console.log('insert')
	let {el} = this.$options
	let input = document.createElement('input')
	input.type = 'file'
	input.addEventListener('change', this.uploadFile)
	input.className = 'img-cropper__insert-file-input'
	// 阻止事件冒泡,防止点击事件被拦截掉
	if (this.$options.stop) {
	  input.addEventListener('click', function (e) {
		e.stopPropagation()
	  })
	}

	el.style.position = 'relative'
	el.style.overflow = 'hidden'

	el.appendChild(input)
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
  uploadImage = (img) => {
	if (this.$options.upload) {
	  this.$options.upload(img, (err, res) => {
		err ? this.fire('upload-error', err) : this.fire('upload', res)
	  })
	  return
	}

	const form = this.generateForm(img)

	request(this.$options.uploadUrl, form)
		.then(res => {
		  this.fire('upload', res)
		})
		.catch(e => {
		  this.fire('upload-error', e)
		})
  }

  // 生成formData
  generateForm(img) {
	let form = new FormData()
	let {getFormData} = this.$options
	let formData = {}

	if (typeof getFormData === 'function') {
	  formData = getFormData()
	}

	Object.keys(formData).forEach(key => {
	  form.append(key, formData[key])
	})
	let blob = this.$options.blob ? img : dataURLtoBlob(img)
	form.append(this.$options.fileName, blob, Date.now() + '.' + this.$options.MIME)

	return form
  }

  static isMobile = isMobile
  static getObjectUrl = getObjectURL
  static dataURLtoBlob = dataURLtoBlob
}
