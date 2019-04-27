### 截图上传组件

#### 简介
基于[cropperjs](https://github.com/fengyuanchen/cropperjs)和[preact](https://preactjs.com/)的二次开发
包内已包含这两个组件,gzip后16k.
umd格式,可`<script>`和import引入使用.


#### 安装
js: `npm i @redbuck/image-uploader`或`yarn add @redbuck/image-uploader`

css: 位于`@redbuck/image-uploader/lib/imageUploader.css`

#### 使用
```
const uploader = new ImageUploader(options)
```

options:

属性 | 类型 | 默认值|描述
--:|--:|--:|--:
width| `Number` | 100|截图框及输出尺寸
height| `Number` | 100|截图框及输出尺寸
MIME| `String` | 'image/png'|输出及上传返回图片格式
blob|`Boolean`|false|crop派发blob
cropperOptions| `Object` | 见下方|cropperjs的配置
upload|`Function`| undefined|自定义上传回调(覆盖内置上传逻辑)
uploadUrl|`String`| '/'|上传路径
fileName|`String`|'imgFile'|图片字段名
getFormData|`Function`|undefined|返回除了图片字段外,其余form字段的函数
getFormDataAsync|`Function`|undefined|异步的getFormData
el|`Element`|undefined|隐形file标签的挂载点
stop|`Boolean`|true|组件是否拦截事件,不冒泡(修复插入dom时,事件被拦截)
crop|`Boolean`|true|是否需要截图
multi|`Boolean`|false|是否开启批量传图,批量传图不能截图
responseFormat|`Function`|o=>o.data|格式化后端返回,批量传图时的预览会使用这个函数
deleteRequest|`Function`|undefined|批量上传中的删除接口,用于删除远程图片
description|`String`|''|截图框的提示语
limit|`Number`|2048000(b)|上传的体积限制
toast|`Function`|console.log|体积超出的提示方法
overSizeMessage|`Any`|您选择的文件过大|体积超出的提示语,可以是对象.toast调用的参数


cropperOptions: (详见[cropper官网](https://fengyuanchen.github.io/cropperjs/))
```javascript
{
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
```
实例支持浏览器事件风格绑定回调.
```
uploader.on(event, callback)
```
支持的事件

事件|参数|描述
--:|--:|--:|
crop|imageData|截图事件,截图完成,上传之前.blob或base64
error|Error|打开截图框的错误
upload|后端response及getFormData的返回结果|上传成功事件.
upload-error|后端response|上传失败事件.
multi-upload|最终留下的所有后端response|批量传图确定

#### 上传行为
未配置upload方法时,crop之后将立即向配置项中的`uploadUrl`提交一个formData,携带图片转换成的blob,字段名为配置项中的`fileName`.如果还有其余字段,可以配置`getFormData字段`,返回一个对象,这个对象将被合并到表单中


如果需要完全自定义上传行为,可以配置`upload`方法,当配置该字段时,插件将忽略上述行为.改为调用该方法.
注入imageData和一个callback.callback用于继续派发`upload`或`upload-error`事件.因此,在自定义逻辑执行完之后,建议调用该callback,以保证组件的行为一致.
callback为node的错误优先风格.以下为示例.
```
const uploader = new ImageUploader({
  upload: (img, callback) => {
    myUploadApi(img)
        .then(res => {
        // 调用callback,派发实例的upload事件
            callback(null, res)
        })
        .catch(err => {
            callback(err, null)
        })
  },
})

// 无论有没有配置upload,以下代码均无需修改
uploader.on('upload', res => {
    // do some thing
})
```

#### 示例
##### 直接载入图片
```javascript
const bUploader = new ImageUploader({
  width: 300,
  height: 300,
})

// 指定需要截取的图片
 bUploader.showCropper('/static/1.jpg')
```

##### 监听file的change事件
```javascript
const uploader = new ImageUploader({
  width: 300,
  height: 300
})

// 监听file载入事件
$file.addEventListener('change', e => {
  uploader.uploadFile(e)
})
```

##### 绑定元素
给options的el字段绑定一个dom即可,组件会将一个透明的file插入该元素.
```javascript
const iUploader = new ImageUploader({
  width: 300,
  height: 300,
  el: document.getElementById('insert')
})
```

#### 直接传图
配置crop字段为false即可
```javascript
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
```

#### 批量传图
multi字段设置true,批量传图不支持截图,点击确定时,一次性返回上传结果,支持拖拽上传
```javascript
	const dUploader = new ImageUploader({
	  blob: true,
	  uploadUrl: 'http://up-z2.qiniup.com/',
	  el: $('#multiUpload'),
	  fileName: 'file',
	  multi: true,
	  getFormData() {
		return {
		  key: 'demo/' + Date.now() + '.png',
		  token,
		}
	  },
	  // 删除已上传的图片
      deleteRequest(payload, callback) {
        API.delQiNiuItem(payload.response.data.key)
            .then(res => {
              console.log(res)
              // 调用callback,组件删除本地图片
              callback()
            })
            .catch(callback)
      },
	})

    dUploader.on('multi-upload', res => {
      console.log(res.complete)
    })
```

### 实例API
1. showCropper
签名`uploader.showCropper([imagePath])`
弹出一个截图框,imagePath为一个合法图片地址时,载入该图片,并初始化截图模块.
没有参数时,展示一个空的截图框,(截图框可以点击按钮载入图片.)
2. uploadFile
签名`uploader.uploadFile(fileChangeEvent, [isCrop])`
接受一个<input type="file">的change事件产生的event,一个是否需要截图的布尔值.
从event中获取一个imgFile,将其加入一个表单,向配置地址提交.如果配置中配置了其余表单项,会将其余部分加入.最终触发一系列事件.


