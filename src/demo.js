// 未编译API,需要引入polyfill
import 'core-js'
import ImageUploader from './package/main'
import request from './package/request'
import {dataURLtoBlob} from './package/dom';

const login = () => {
  let form = new FormData()
  form.append('account', 'xyf')
  form.append('password', '123457')
  form.append('rememberPasswordundefined', '')
  request('/yunhuiyuan/', form)
	  .then(res => {
		console.log(res)
	  })
	  .catch(e => {
		console.log(e)
	  })
}

const upload = img => {
  let form = new FormData()
  let blob = dataURLtoBlob(img)
  form.append('imgFile', blob, Date.now() + '.png')
  return request('/yunhuiyuan/UploadFile/UploadSingleImage?isCompress=true', form)
}

login()

const $file = document.getElementById('file')
const $btn = document.getElementById('btn')
const $cropedImage = document.getElementById('cropedImage')
const $cdnImage = document.getElementById('cdnImage')

const uploader = new ImageUploader({
  width: 300,
  height: 300,
  upload: (img, callback) => {
	upload(img)
		.then(res => {
		  callback(null, res)
		})
		.catch(callback)
  },
})

// 截图事件,此时尚未提交,回调注入base64图片
uploader.on('crop', e => {
  $cropedImage.style.width = uploader.$options.width + 'px'
  $cropedImage.style.height = uploader.$options.height + 'px'
  $cropedImage.src = e
})

// 上传成功事件.回调注入后端返回response
uploader.on('upload', e => {
  console.log('upload success', e)
  $cdnImage.style.width = uploader.$options.width + 'px'
  $cdnImage.style.height = uploader.$options.height + 'px'
  $cdnImage.src = e.url
})

$file.addEventListener('change', e => {
  uploader.uploadFile(e)
})

const bUploader = new ImageUploader({
  width: 300,
  height: 300,
})

bUploader.on('upload', e => {
  console.log('btn croped image', e.url)
})

$btn.addEventListener('click', e => {
  bUploader.showCropper('/static/1.jpg')
})

