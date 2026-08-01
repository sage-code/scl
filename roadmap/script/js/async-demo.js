/* async-demo.js content */
function loadAsset(url, type, callback) {
  let xhr = new XMLHttpRequest();

  // fetch the immage from URL
  xhr.open('GET', url); 
  xhr.responseType = type;

  // execite the callback
  xhr.onload = function() {
    callback(xhr.response);
  };

  xhr.send();
}

// function wrapper that interact with DOM
function displayImage(blob) {
  let objectURL = URL.createObjectURL(blob);

  let image = document.createElement('img');
  image.src = objectURL;

  // find the target div that is display below
  const target = document.querySelector('#load-async-demo');
  target.appendChild(image);
}