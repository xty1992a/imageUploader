import preact, {h, render, Component} from 'preact'
import {dataURLtoBlob, getObjectURL} from './dom'
import Action from './Action'
import './fileAction.less'

class FileItem extends Component {
  state = {
	complete: false,
	path: '',
  }

  constructor(props) {
	super(props);
  }

  componentDidMount() {
	console.log(this.props)
  }

  upload = () => new Promise((resolve, reject) => {
	if (this.comlete) {
	  resolve(null)
	}
	console.log(' up load ', this.props.file.name, this.state)

	this.props.uploadRequest(this.props.file)
		.then(res => {
		  this.comlete = true
		  this.uploadResponse = res
		  let data = this.props.responseFormat(res)

		  console.log(data)
		  this.setState({
			complete: true,
			path: data.path,
		  })
		  resolve(res)
		})
		.catch(err => {
		  console.log('error is ', err)
		  this.comlete = true
		  this.setState({
			complete: true,
			path: '',
		  })
		  reject(err)
		})

  })

  deleteFn = () => {
	this.props.onDelete({
	  response: this.uploadResponse,
	  file: this.props.file,
	})
  }

  render(props, state, context) {
	return (
		<div className="file-item">
		  <span className="delete-btn" onClick={this.deleteFn}></span>
		  {
			this.state.complete ? (
				<img src={this.state.path} alt=""/>
			) : (
				<p>上传中...</p>
			)
		  }
		</div>
	)
  }

}

export class FileAction extends Component {
  _fileItem = []
  state = {
	uploadFileList: [],
  }

  constructor(props) {
	super(props)
	this.completeList = []
	this.failedList = []
  }

  confirm = () => {
	console.log('confirm')
	this.props.promise && this.props.promise.resolve({
	  complete: this.completeList,
	  failed: this.failedList,
	});
	this._action.close();
  }

  close = () => {
	this._action.close();
  }

  actionCancel = () => {
	this.props.promise && this.props.promise.reject('user cancel !')
  }

  uploadFile = (e) => {
	let files = [...(e.target.files || e.dataTransfer.files)]
	if (!files.length) return false

	console.log(files)
	let imageFiles = files.filter(it => it.type.includes('image'))
	if (imageFiles.length !== files.length) {
	  console.warn('插件只能上传图片!')
	}

	this.setState({
	  uploadFileList: [...this.state.uploadFileList, ...imageFiles],
	})

	// this.uploadByStep(imageFiles)
	setTimeout(() => {
	  this.uploadCount = 0
	  this.forceUpload()
	}, 20)
  }

  forceUpload() {
	if (this.uploadCount === this._fileItem.length) return

	let fileItem = this._fileItem.find(it => !it.state.complete)
	this.uploadCount++
	if (!fileItem) return
	fileItem.upload()
		.then(res => {
		  this.completeList.push(res)
		  this.forceUpload()
		})
		.catch(err => {
		  this.forceUpload()
		  this.failedList.push(err)
		})
  }

  deleteFileItem = (payload) => {
	this.afterDelRequest(payload)
		.then(res => {
		  this.setState({
			uploadFileList: this.state.uploadFileList.filter(it => it !== payload.file),
		  })
		  this.completeList = this.completeList.filter(it => it !== payload.response)
		})
  }

  afterDelRequest = (payload) => new Promise(resolve => {
	if (!this.props.deleteRequest) {
	  resolve()
	}
	else {
	  this.props.deleteRequest(payload, resolve)
	}
  })

  componentDidMount() {
	setTimeout(() => {
	  this._action.show();
	  console.log(this.state.uploadFileList)
	}, 20);
  }

  componentWillUnmount() {
  }

  render(props, state, context) {
	return (
		<Action
			className="uploader-action file-action"
			ref={child => this._action = child}
			onCancel={this.actionCancel}
			position={this.props.isMobile ? 'right' : 'center'}
			stop={true}
		>
		  <div className={`uploader-action-body ${this.props.isMobile ? 'mobile' : 'desktop'}`}>
			<div className="file-action-body">
			  {
				this.state.uploadFileList.map(file => (
					<FileItem file={file}
							  onDelete={this.deleteFileItem}
							  uploadRequest={this.props.uploadRequest}
							  responseFormat={this.props.responseFormat}
							  ref={c => this._fileItem.push(c)}
							  key={file.name}/>
				))
			  }
			  <div className="file-item file-btn">
				<span>+</span>
				<input type="file" multiple="multiple" className="img-cropper__insert-file-input" onChange={this.uploadFile}/>
			  </div>
			</div>
			<div className="uploader-action-foot">
			  <button className="img-cropper__btn btn-cancel" onClick={this.close}>取消</button>
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
	render(<FileAction {...options}/>, document.body, el);
  })
}
