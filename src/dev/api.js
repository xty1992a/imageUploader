import request from '../package/request'
import {dataURLtoBlob} from '../package/dom';

export const myUploadApi = (img, token) => {
  let form = new FormData()
  let blob = (img instanceof Blob) ? img : dataURLtoBlob(img)
  let fileName = Date.now() + '.png'
  form.append('file', blob, fileName)
  form.append('key', 'demo/' + fileName)
  form.append('token', token)
  return request('http://up-z2.qiniup.com/', form)
}

export const getQiNiuToken = () => request('/api/upload/qiniu_token', {}, 'get');
export const delQiNiuItem = (key) => request(`/api/upload/del_qiniu?key=${key}`, {}, 'get');
