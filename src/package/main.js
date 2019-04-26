/**
 * Created by TY-xie on 2018/3/29.
 */
import './index.less'
import {css, getParentByClassName, isMobile, getObjectURL, dataURLtoBlob, rdm} from './tools'
import cropImage from './CropperAction'
import showFileAction from './FileAction'
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
  crop: true, // 是否需要截图,多选无效
  multi: false, // 是否开启批量传图,批量传图下不能截图
  getFormData: void 0,
  responseFormat: o => o.data,
  deleteRequest: void 0,
}

const form2Obj = form => {
  try {

	if (!form instanceof FormData) return form
	const obj = {}
	const keys = form.keys()
	for (var key of keys) {
	  obj[key] = form.get(key)
	}
	return obj
  } catch (e) {
	console.log(e)
  }
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
	let {el, multi} = this.$options
	el.style.position = 'relative'
	el.style.overflow = 'hidden'

	if (multi) {
	  const btn = this.generateMultiBtn()
	  el.appendChild(btn)
	}
	else {
	  const input = this.generateFile()
	  el.appendChild(input)
	}
  }

  generateFile() {
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
	return input
  }

  generateMultiBtn() {
	let button = document.createElement('button')
	button.className = 'img-cropper__insert-file-input'
	button.addEventListener('click', this.showFileAction)
	if (this.$options.stop) {
	  button.addEventListener('click', function (e) {
		e.stopPropagation()
	  })
	}
	return button
  }

  // 图片载入完成,显示截图框
  showCropper = (url) => {
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

  showFileAction = (opt = this.$options) => {
	console.log('show file action', this.$options.responseFormat)
	showFileAction({
	  uploadRequest: this.uploadRequest,
	  responseFormat: this.$options.responseFormat, // 格式化后端返回值
	  deleteRequest: this.$options.deleteRequest,
	  isMobile,
	  ...opt,
	})
		.then(res => {
		  this.fire('multi-upload', res)
		})
		.catch(e => {
		  this.fire('error', e)
		})
  }

  // 提供给实例用于加载input的文件
  uploadFile = (e, crop = this.$options.crop) => {
	console.log(e, crop, 'is crop')

	let files = e.target.files || e.dataTransfer.files
	if (!files.length) return false
	if (!files[0].type.includes('image')) {
	  return false
	}
	this.rowData = files[0]
	if (crop) {
	  this.showCropper(getObjectURL(this.rowData))
	}
	else {
	  this.uploadImage(this.rowData)
	}
  }

  // 将图片上传后台
  uploadImage = (img) => {
	this.uploadRequest(img)
		.then(res => {
		  this.fire('upload', res)
		})
		.catch(e => {
		  this.fire('upload-error', e)
		})
  }

  // 上传接口
  uploadRequest = (img) => new Promise((resolve, reject) => {
	if (this.$options.upload) {
	  this.$options.upload(img, (err, res) => {
		err ? reject(err) : resolve(res)
	  })
	}
	else {
	  // const form =  this.generateForm(img)
	  this.generateForm(img)
		  .then(form => {
			return request(this.$options.uploadUrl, form)
		  })
		  .then(res => {
			resolve({
			  ...res,
			  formData: this.formData,
			})
		  })
		  .catch(reject)
	}
  })

  // 生成formData
  generateForm(img) {
	return new Promise(resolve => {
	  this.getFormData()
		  .then(form => {
			let blob = this.$options.blob ? img : dataURLtoBlob(img)
			form.append(this.$options.fileName, blob, Date.now() + '.' + this.$options.MIME)
			resolve(form)
		  })
	})
  }

  getFormData() {
	return new Promise(resolve => {
	  let form = new FormData()
	  let {getFormData, getFormDataAsync} = this.$options
	  if (typeof getFormData === 'function') {
		let formData = getFormData()
		if (typeof formData === 'object') {
		  this.formData = formData
		  Object.keys(formData).forEach(key => {
			form.append(key, formData[key])
		  })
		}
		resolve(form)
		return
	  }
	  if (typeof getFormDataAsync === 'function') {
		getFormDataAsync((formData) => {
		  if (typeof formData === 'object') {
			this.formData = formData
			Object.keys(formData).forEach(key => {
			  form.append(key, formData[key])
			})
		  }
		  resolve(form)
		})
		return
	  }
	  resolve(form)
	})
  }

  static isMobile = isMobile
  static getObjectUrl = getObjectURL
  static dataURLtoBlob = dataURLtoBlob
  static rdm = rdm
}
