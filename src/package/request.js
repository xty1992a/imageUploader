// https://www.yunhuiyuan.cn/UploadFile/UploadSingleImage?isCompress=true
function formatResult(raw) {
  let result = raw
  try {
	result = JSON.parse(raw)
  } catch (e) {
	console.log(e)
  }
  return result
}

export default function (url, data, method, process) {
  return new Promise((resolve, reject) => {
	const xhr = new XMLHttpRequest();
	xhr.open(method || 'POST', url);
	xhr.send(data);
	xhr.onreadystatechange = function () {
	  const DONE = 4;
	  const OK = 200;
	  if (xhr.readyState === DONE) {
		if (xhr.status >= 200 && xhr.status < 300) {
		  resolve(formatResult(xhr.responseText))
		}
		else {
		  console.log('Error: ' + xhr.status);
		  reject(xhr.status)
		}
	  }
	}
	xhr.upload.onprogress = function (event) {
	  if (event.lengthComputable) {
		process && process(Math.floor(event.loaded / event.total * 100))
	  }
	}
  })
}
