import preact, {h, render, Component} from 'preact'
import Cropper from 'cropperjs'
import {dataURLtoBlob, getObjectURL} from './tools'
import Action from './Action'
import './cropAction.less'

export class CropperAction extends Component {
  state = {
	imgPath: '',
  }

  constructor(props) {
	super(props)
  }

  confirm = () => {
	console.log('confirm')
	let result = this.crop()
	this.props.promise && this.props.promise.resolve(result);
	this._action.close();
  }

  close = () => {
	this._action.close();
  }

  actionCancel = () => {
	this.props.promise && this.props.promise.reject('user cancel !')
  }

  crop = () => {
	if (!this.croppable) return
	let cvs = this.cropper.getCroppedCanvas({
	  width: this.props.width,
	  height: this.props.height,
	})
	if (cvs) {
	  let url = cvs.toDataURL('image/' + this.props.MIME)
	  let result = url
	  if (this.props.blob) {
		result = dataURLtoBlob(url)
	  }
	  return result
	}
  }

  createCrop = () => {
	this.croppable = false
	this.cropper && this.cropper.destroy()
	console.log('image loaded will create crop')
	setTimeout(() => {
	  let img = this._img
	  let ratio = this.props.width / this.props.height
	  let options = {
		...this.props.cropperOptions,
		aspectRatio: ratio,
		ready: () => {
		  console.log('crop is ready')
		  this.croppable = true
		},
	  }
	  this.cropper = new Cropper(img, options)
	  console.log(this.cropper)
	}, 20)
  }

  reload = (e) => {
	// this.cropper && this.cropper.destroy()
	let files = e.target.files || e.dataTransfer.files
	if (!files.length) return false
	if (!files[0].type.includes('image')) {
	  return false
	}
	if (files[0].size > this.props.limit) {
	  this.props.toast(this.props.overSizeMessage)
	  return
	}

	this.objectUrl && URL.revokeObjectURL(this.objectUrl)
	this.objectUrl = getObjectURL(files[0])
	this.setState({
	  imgPath: this.objectUrl,
	})
  }

  componentDidMount() {
	console.log(this.props)
	// 如果链接是blob链接,标记该链接为objectUrl,在更换,销毁时将会统一revoke
	let {url} = this.props
	if (typeof url === 'string') {
	  this.setState({
		imgPath: url,
	  })
	  this.objectUrl = url
	}
	setTimeout(() => {
	  this._action.show();
	}, 20);
  }

  geBodyStyle() {
	return this.props.description ? 'top: 60px' : ' top: 36px;'
  }

  componentWillUnmount() {
	this.objectUrl && URL.revokeObjectURL(this.objectUrl)
	this.cropper && this.cropper.destroy()
  }

  render(props, state, context) {
	return (
		<Action
			className="uploader-action crop-action"
			ref={child => this._action = child}
			onCancel={this.actionCancel}
			position={this.props.isMobile ? 'right' : 'center'}
			stop={true}
		>
		  <div className={`uploader-action-body ${this.props.isMobile ? 'mobile' : 'desktop'}`}>
			<div className="uploader-action-head">
			  <h3>截图</h3>
			  {
				this.props.description && (
					<p>{this.props.description}</p>
				)
			  }
			</div>
			<div className="crop-body" style={this.geBodyStyle()}>
			  {
				this.state.imgPath ? (
					<img src={this.state.imgPath} alt="" onLoad={this.createCrop} crossOrigin="anonymous" ref={c => this._img = c}/>
				) : (
					<div className="file-btn">
					  <span>+</span>
					  <input type="file" onChange={this.reload} className="img-cropper__insert-file-input"/>
					</div>
				)
			  }
			</div>
			<div className="uploader-action-foot">
			  <button className="img-cropper__btn btn-cancel" onClick={this.close}>取消</button>
			  <button className="img-cropper__btn btn-normal">
				<input type="file" onChange={this.reload} className="img-cropper__insert-file-input"/>
				<span>重新选择</span>
			  </button>
			  <button className="img-cropper__btn btn-primary" onClick={this.confirm}>确定</button>
			</div>
		  </div>
		</Action>
	)
  }
}

export default function (options) {
  return new Promise((resolve, reject) => {
	const el = document.createElement('div');
	document.body.appendChild(el);
	options.promise = {reject, resolve};
	render(<CropperAction {...options}/>, document.body, el);
  })
}
