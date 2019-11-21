/**
 * Created by TY-xie on 2018/3/29.
 */
import './index.less';
import {css, getParentByClassName, isMobile, getObjectURL, dataURLtoBlob, rdm} from './tools';
import cropImage from './CropperAction';
import showFileAction from './FileAction';
import request from './request';

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
};
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
  description: '',
  responseFormat: o => o.data,
  limit: 2048000, // 2mb
  overSizeMessage: '您选择的文件过大',
  deleteRequest: void 0,
  toast: console.log,
  accept: 'image/*',
  capture: 'camera',
  configInput: () => {}
};

class EmitAble {
  task = {};

  on(event, callback) {
	this.task[event] = callback;
  }

  fire(event, payload) {
	this.task[event] && this.task[event](payload);
  }
}

export default class ImageUploader extends EmitAble {
  rowData = null;
  cropper = null;

  constructor(opt) {
	super();
	this.$options = {
	  ...defaultOptions,
	  ...opt,
	  cropperOptions: {
		...cropperOptions,
		...(opt.cropperOptions || {}),
	  },
	};
	// ios设置capture可能导致直接打开摄像头而不能选择相册
	if(/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
	  this.$options.capture = ''
	}
	if (opt.el && opt.el instanceof Element) {
	  this.insertDom();
	}
  }

  insertDom() {
	let {el, multi} = this.$options;
	el.style.position = 'relative';
	el.style.overflow = 'hidden';

	if (multi) {
	  const btn = this.insertBtn = this.generateMultiBtn();
	  el.appendChild(btn);
	}
	else {
	  const input = this.insertBtn = this.generateFile();
	  el.appendChild(input);
	}
  }

  generateFile() {
	let input = document.createElement('input');
	input.type = 'file';
	input.addEventListener('change', this.uploadFile);
	this.$options.accept && input.setAttribute('accept', this.$options.accept)
	this.$options.capture && input.setAttribute('capture', this.$options.capture)
	input.className = 'img-cropper__insert-file-input';
	// 阻止事件冒泡,防止点击事件被拦截掉
	if (this.$options.stop) {
	  input.addEventListener('click', function (e) {
		e.stopPropagation();
	  });
	}
	try{
		this.$options.configInput && this.$options.configInput(input)
	}catch (e) {
	}
	return input;
  }

  generateMultiBtn() {
	let button = document.createElement('button');
	button.className = 'img-cropper__insert-file-input';
	button.addEventListener('click', this.showFileAction);
	if (this.$options.stop) {
	  button.addEventListener('click', function (e) {
		e.stopPropagation();
	  });
	}
	return button;
  }

  // 图片载入完成,显示截图框
  showCropper = (url) => {
	console.log(url);
	cropImage({
	  url,
	  isMobile,
	  action: cropper => {
		this.cropper = cropper;
		this.fire('cropper-created', cropper)
	  },
	  ...this.$options,
	})
		.then(res => {
		  this.fire('crop', res);
		  this.uploadImage(res);
		})
		.catch(e => {
		  this.fire('error', e);
		});
  };

  showFileAction = (opt = this.$options) => {
	console.log('show file action', this.$options.responseFormat);
	showFileAction({
	  uploadRequest: this.uploadRequest,
	  responseFormat: this.$options.responseFormat, // 格式化后端返回值
	  deleteRequest: this.$options.deleteRequest,
	  isMobile,
	  ...opt,
	})
		.then(res => {
		  this.fire('multi-upload', res);
		})
		.catch(e => {
		  this.fire('error', e);
		});
  };

  // 提供给实例用于加载input的文件
  uploadFile = (e, crop = this.$options.crop) => {
	let files = e.target.files || e.dataTransfer.files;
	if (!files.length) return false;
	if (!files[0].type.includes('image')) {
	  return false;
	}
	console.log(files[0].size, this.$options.limit);
	this.rowData = files[0];
	e.target.value = '';
	if (this.rowData.size > this.$options.limit) {
	  this.$options.toast(this.$options.overSizeMessage);
	  return;
	}
	if (crop) {
	  this.showCropper(getObjectURL(this.rowData));
	}
	else {
	  this.uploadImage(this.rowData);
	}
  };

  // 将图片上传后台
  uploadImage = (img) => {
	this.fire('upload-start');
	this.uploadRequest(img)
		.then(res => {
		  this.fire('upload', res);
		  this.fire('upload-end');
		})
		.catch(e => {
		  this.fire('upload-error', e);
		  this.fire('upload-end');
		});
  };

  // 上传接口
  uploadRequest = (img) => new Promise((resolve, reject) => {
	if (this.$options.upload) {
	  this.$options.upload(img, (err, res) => {
		err ? reject(err) : resolve(res);
	  });
	}
	else {
	  // const form =  this.generateForm(img)
	  this.generateForm(img)
		  .then(form => {
			return request(this.$options.uploadUrl, form);
		  })
		  .then(res => {
			resolve({
			  ...res,
			  formData: this.formData,
			});
		  })
		  .catch(reject);
	}
  });

  changeCropSize = ({width = this.$options.width, height = this.$options.height}) => {
	this.$options.width = width;
	this.$options.height = height;
  };

  // 生成formData
  generateForm(img) {
	return new Promise(resolve => {
	  this.getFormData()
		  .then(form => {
			let blob = this.$options.blob ? img : dataURLtoBlob(img);
			form.append(this.$options.fileName, blob, Date.now() + '.' + this.$options.MIME);
			resolve(form);
		  });
	});
  }

  getFormData() {
	return new Promise(resolve => {
	  let form = new FormData();
	  let {getFormData, getFormDataAsync} = this.$options;
	  if (typeof getFormData === 'function') {
		let formData = getFormData();
		if (typeof formData === 'object') {
		  this.formData = formData;
		  Object.keys(formData).forEach(key => {
			form.append(key, formData[key]);
		  });
		}
		resolve(form);
		return;
	  }
	  if (typeof getFormDataAsync === 'function') {
		getFormDataAsync((formData) => {
		  if (typeof formData === 'object') {
			this.formData = formData;
			Object.keys(formData).forEach(key => {
			  form.append(key, formData[key]);
			});
		  }
		  resolve(form);
		});
		return;
	  }
	  resolve(form);
	});
  }

  destroy() {
	this.task = {};
	if (this.$options.el) {
	  this.$options.el.removeChild(this.insertBtn);
	}
  }

  static isMobile = isMobile;
  static getObjectUrl = getObjectURL;
  static dataURLtoBlob = dataURLtoBlob;
  static rdm = rdm;
}
