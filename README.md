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
uploadUrl|`String`| '/yunhuiyuan/UploadFile/UploadSingleImage?isCompress=true'|上传路径
fileName|`String`|'imgFile'|图片字段
el|`Element`|undefined|隐形file标签的挂载点

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
支持事件

事件|参数|描述
--:|--:|--:|
crop|imageData|截图事件,截图完成,上传之前.blob或base64
error|Error|打开截图框的错误
upload|后端response|上传成功事件.
upload-error|后端response|上传失败事件.

#### 上传行为
未配置upload方法时,crop之后将立即向*当前域名下*/`uploadUrl`提交一个formData,携带图片转换成的blob,字段名为配置`fileName`.

如果有更多的参数,可以配置`upload`,当配置该字段时,插件将忽略上述行为.改为调用该方法.
注入imageData和一个callback.callback用于继续派发`upload`或`upload-error`事件.因此,在自定义逻辑执行完之后,建议调用该callback,以保证组件的行为一致.
callback为node的错误优先风格.以下为示例.
```
const uploader = new ImageUploader({
  upload: (img, callback) => {
    myUploadApi(img)
    .then(res => {
        callback(null, res)
    })
    .catch(callback)
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
