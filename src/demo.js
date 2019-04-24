// 未编译API,需要引入polyfill
import 'core-js'
import ImageUploader from './package/main'
import request from './package/request'
import {dataURLtoBlob, getObjectURL} from './package/dom';

const myUploadApi = (img, token) => {
  let form = new FormData()
  let blob = (img instanceof Blob) ? img : dataURLtoBlob(img)
  let fileName = Date.now() + '.png'
  form.append('file', blob, fileName)
  form.append('key', fileName)
  form.append('token', token)
  return request('http://up-z2.qiniup.com/', form)
}

// 获取七牛token
const getQiNiuToken = () => request('/api/upload/qiniu_token', {}, 'get');

(async () => {
  try {
	let token = await getQiNiuToken()
	token = token.success ? token.data.token : ''

	const $file = document.getElementById('file')
	const $btn = document.getElementById('btn')
	const $cropedImage = document.getElementById('cropedImage')
	const $cdnImage = document.getElementById('cdnImage')
	const $btnImage = document.getElementById('btnImage')

	// region 监听file的change事件
	const uploader = new ImageUploader({
	  width: 300,
	  height: 300,
	  blob: true,
	  uploadUrl: 'http://up-z2.qiniup.com/',
	  fileName: 'file',
	  getFormData() {
		return {
		  key: Date.now() + '.png',
		  token,
		}
	  },
	})

// 截图事件,此时尚未提交,回调注入base64图片
	/*
	  uploader.on('crop', e => {
		console.log(e)
		$cropedImage.style.width = uploader.$options.width + 'px'
		$cropedImage.style.height = uploader.$options.height + 'px'
		$cropedImage.src = (e instanceof Blob) ? getObjectURL(e) : e
	  })
	*/

// 上传成功事件.回调注入后端返回response
	uploader.on('upload', e => {
	  $cdnImage.src = e.data.path
	})
	uploader.on('error', e => {
	  console.log('uploader err ', e)
	})

// 监听file载入事件
	$file.addEventListener('change', e => {
	  uploader.uploadFile(e)
	})

	// endregion

	// region 截取指定图片
	const bUploader = new ImageUploader({
	  width: 300,
	  height: 300,
	  blob: true,
	  uploadUrl: 'http://up-z2.qiniup.com/',
	  fileName: 'file',
	  getFormData() {
		return {
		  key: Date.now() + '.png',
		  token,
		}
	  },
	})

	bUploader.on('upload', res => {
	  $cropedImage.src = res.data.path
	})

	$btn.addEventListener('click', e => {
	  bUploader.showCropper('/static/1.jpg')
	})

	// endregion

	// region 指定挂载dom及自定义上传行为
	const iUploader = new ImageUploader({
	  width: 300,
	  height: 300,
	  el: document.getElementById('insert'),
	  upload: (img, callback) => {
		myUploadApi(img, token)
			.then(res => {
			  callback(null, res)
			})
			.catch(err => {
			  callback(err)
			})
	  },

	})

	iUploader.on('upload', res => {
	  console.log(res)
	  if (res.success) {
		$btnImage.src = res.data.path
	  }
	})

	// endregion

  } catch (e) {
	console.log(e)
  }
})()

