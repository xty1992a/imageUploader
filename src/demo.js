// 未编译API,需要引入polyfill
import 'core-js'
import ImageUploader from './package/main'
import * as API from './dev/api'

const $ = d => document.querySelector(d);

function createImg(src) {
  const img = new Image()
  img.src = src
  return img
}

// 获取七牛token
(async () => {
  try {
	let token = await API.getQiNiuToken()
	token = token.success ? token.data.token : ''

	const $file = $('#file')
	const $btn = $('#btn')
	const $cropedImage = $('#cropedImage')
	const $cdnImage = $('#cdnImage')
	const $btnImage = $('#btnImage')

	// region 监听file的change事件
	const uploader = new ImageUploader({
	  width: 300,
	  height: 300,
	  blob: true,
	  uploadUrl: 'http://up-z2.qiniup.com/',
	  fileName: 'file',
	  getFormData() {
		return {
		  key: 'demo/' + Date.now() + '.png',
		  token,
		}
	  },
	})

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
		  key: 'demo/' + Date.now() + '.png',
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
	  el: $('#insert'),
	  upload: (img, callback) => {
		API.myUploadApi(img, token)
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

	// region 不截图直接传
	const cUploader = new ImageUploader({
	  blob: true,
	  crop: false,
	  uploadUrl: 'http://up-z2.qiniup.com/',
	  el: $('#upload'),
	  fileName: 'file',
	  getFormData() {
		return {
		  key: 'demo/' + Date.now() + '.png',
		  token,
		}
	  },
	})

	cUploader.on('upload', res => {
	  console.log(res)
	  $('#uploadImage').src = res.data.path
	})

	// endregion

	// region 批量上传
	const dUploader = new ImageUploader({
	  blob: true,
	  uploadUrl: 'http://up-z2.qiniup.com/',
	  el: $('#multiUpload'),
	  fileName: 'file',
	  multi: true,
	  deleteRequest(payload, callback) {
		console.log(payload.response.data.key)
		API.delQiNiuItem(payload.response.data.key)
			.then(res => {
			  console.log(res)
			  callback()
			})
			.catch(callback)
	  },
	  getFormData() {
		return {
		  key: 'demo/' + Date.now() + '.png',
		  token,
		}
	  },
	})

	dUploader.on('multi-upload', res => {
	  console.log(res.complete)
	  const fragment = document.createDocumentFragment()

	  res.complete.forEach(res => {
		fragment.appendChild(createImg(res.data.path))
	  })
	  console.log(fragment)

	  $('#multi-block').appendChild(fragment)

	})

	// endregion

	// region 异步获取formData
	const eUploader = new ImageUploader({
	  blob: true,
	  crop: false,
	  uploadUrl: 'http://up-z2.qiniup.com/',
	  el: $('#asyncUpload'),
	  fileName: 'file',
	  getFormDataAsync(callback) {
		setTimeout(() => {
		  callback({
			key: 'demo/' + Date.now() + '.png',
			token,
		  })
		}, 1000)
	  },
	})

	eUploader.on('upload', res => {
	  console.log(res)
	  $('#asyncUploadImage').src = res.data.path
	})

	// endregion

  } catch (e) {
	console.log(e)
  }
})()

