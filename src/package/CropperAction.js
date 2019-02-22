import preact, {h, render, Component} from 'preact'
import Cropper from 'cropperjs'
import {dataURLtoBlob, getObjectURL} from './dom'
import Action from './Action'
import './cropAction.less'

export class CropperAction extends Component {
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
	let url = cvs.toDataURL('image/'+this.props.MIME)
	let result = url
	if (this.props.blob) {
	  result = dataURLtoBlob(url)
	}
	return result
  }

  createCrop = (e) => {
	let img = this._img
	let ratio = this.props.width / this.props.height
	let options = {
	  ...this.props.cropperOptions,
	  aspectRatio: ratio,
	  ready: () => {
		this.croppable = true
	  },
	}
	console.log(options, this.props)
	this.cropper = new Cropper(img, options)
  }

  reload = (e) => {
	let files = e.target.files || e.dataTransfer.files
	if (!files.length) return false
	if (!files[0].type.includes('image')) {
	  return false
	}
	this.objectUrl && URL.revokeObjectURL(this.objectUrl)
	this.objectUrl = getObjectURL(files[0])
	this.cropper && this.cropper.replace(this.objectUrl)
  }

  componentDidMount() {
	// 如果链接是blob链接,标记该链接为objectUrl,在更换,销毁时将会统一revoke
	let {url} = this.props
	if (url && /blob/.test(url)) {
	  this.objectUrl = url
	}
	setTimeout(() => {
	  this._action.show();
	}, 20);
  }

  componentWillUnmount() {
	this.objectUrl && URL.revokeObjectURL(this.objectUrl)
	this.cropper && this.cropper.destroy()
  }

  render(props, state, context) {
	return (
		<Action
			className="cropper-action"
			ref={child => this._action = child}
			onCancel={this.actionCancel}
			position={this.props.isMobile ? 'right' : 'center'}
			stop={true}
		>
		  <div className={`crop-wrap ${this.props.isMobile ? 'mobile' : 'desktop'}`}>
			<div className="crop-body">
			  <img src={this.props.url} alt="" onLoad={this.createCrop} crossOrigin="anonymous" ref={c => this._img = c}/>
			</div>
			<div className="crop-foot">
			  <button className="btn btn-cancel" onClick={this.close}>取消</button>
			  <button className="btn btn-normal">
				<input type="file" onChange={this.reload}/>
				<span>重新选择</span>
			  </button>
			  <button className="btn btn-primary" onClick={this.confirm}>确定</button>
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
