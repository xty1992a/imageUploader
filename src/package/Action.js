import './action.less'
import preact, {h, render, Component} from 'preact'

export default class Action extends Component {
  constructor(props) {
	super(props);
	this.state = {
	  show: false,
	};
	this.show = this.show.bind(this);
	this.hide = this.hide.bind(this);
	this.close = this.close.bind(this);
	this.cancel = this.cancel.bind(this);
  }

  show() {
	this.setState({
	  show: true,
	});
  }

  hide() {
	this.setState({
	  show: false,
	});
	this.props.onHide && this.props.onHide();
  }

  close() {
	this.hide();
	setTimeout(() => {
	  let el = this.base;
	  if (!el) return
	  render(null, el.parentNode, el);
	  el && el.parentNode && el.parentNode.removeChild(el);
	}, 320);
  }

  cancel() {
	this.close();
	this.props.onCancel && this.props.onCancel();
  }

  stopMove(e) {
	this.props.stop && e.preventDefault();
  }

  render() {
	return (<div className={`action-container ${this.props.className || ''}`} onMouseWheel={this.stopMove.bind(this)} onTouchMove={this.stopMove.bind(this)}>
	  <div className={this.state.show ? 'action action__show' : 'action'}>
		<div className="action-model mask" onClick={this.cancel}/>
		<div className={`action-${this.props.position || 'center'}`}>
		  {this.props.children}
		</div>
	  </div>
	</div>)
  }
}
