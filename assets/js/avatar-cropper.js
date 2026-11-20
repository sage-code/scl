/**
 * avatar-cropper.js — Client-side avatar zoom, pan, crop, and WebP compression dialog.
 */
(function () {
  var OUTPUT_SIZE = 256;
  var PREVIEW_SIZE = 280;
  var MAX_INPUT_BYTES = 15 * 1024 * 1024;

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Could not decode the selected image."));
      };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve(blob);
      }, type, quality);
    });
  }

  async function encodeOptimizedAvatar(sourceImg, state) {
    var outCanvas = document.createElement("canvas");
    outCanvas.width = OUTPUT_SIZE;
    outCanvas.height = OUTPUT_SIZE;
    var ctx = outCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    var ratio = OUTPUT_SIZE / PREVIEW_SIZE;
    var drawW = state.baseW * state.zoom * ratio;
    var drawH = state.baseH * state.zoom * ratio;
    var drawX = (OUTPUT_SIZE - drawW) / 2 + state.panX * ratio;
    var drawY = (OUTPUT_SIZE - drawH) / 2 + state.panY * ratio;

    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(sourceImg, drawX, drawY, drawW, drawH);

    // Prefer WebP for best size/quality; fall back to JPEG if browser cannot encode WebP.
    var mime = "image/webp";
    var ext = "webp";
    var qualities = [0.85, 0.75, 0.65];
    var blob = null;

    for (var i = 0; i < qualities.length; i += 1) {
      var candidate = await canvasToBlob(outCanvas, mime, qualities[i]);
      if (!candidate || candidate.type !== mime) {
        mime = "image/jpeg";
        ext = "jpg";
        candidate = await canvasToBlob(outCanvas, mime, qualities[i]);
      }
      blob = candidate;
      if (blob && blob.size <= 150 * 1024) {
        break;
      }
    }

    if (!blob) {
      throw new Error("Could not compress the cropped image.");
    }

    return {
      file: new File([blob], "avatar." + ext, { type: mime }),
      mime: mime,
      ext: ext,
      bytes: blob.size
    };
  }

  function initAvatarCropper(options) {
    var dialog = document.getElementById("avatar-crop-dialog");
    var canvas = document.getElementById("avatar-crop-canvas");
    var zoomInput = document.getElementById("avatar-crop-zoom");
    var zoomValue = document.getElementById("avatar-crop-zoom-value");
    var resetBtn = document.getElementById("avatar-crop-reset");
    var saveBtn = document.getElementById("avatar-crop-save");
    var cancelBtn = document.getElementById("avatar-crop-cancel");
    var metaEl = document.getElementById("avatar-crop-meta");

    if (!dialog || !canvas || !zoomInput || !saveBtn) {
      return null;
    }

    var ctx = canvas.getContext("2d");
    var currentImg = null;
    var onConfirm = options && typeof options.onConfirm === "function" ? options.onConfirm : null;
    var onError = options && typeof options.onError === "function" ? options.onError : null;
    var state = {
      baseW: PREVIEW_SIZE,
      baseH: PREVIEW_SIZE,
      zoom: 1,
      panX: 0,
      panY: 0,
      dragging: false,
      pointerId: null,
      lastX: 0,
      lastY: 0
    };

    function clampPan() {
      var drawW = state.baseW * state.zoom;
      var drawH = state.baseH * state.zoom;
      var maxPanX = Math.max(0, (drawW - PREVIEW_SIZE) / 2);
      var maxPanY = Math.max(0, (drawH - PREVIEW_SIZE) / 2);
      state.panX = Math.max(-maxPanX, Math.min(maxPanX, state.panX));
      state.panY = Math.max(-maxPanY, Math.min(maxPanY, state.panY));
    }

    function draw() {
      if (!currentImg) return;
      clampPan();
      ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

      var drawW = state.baseW * state.zoom;
      var drawH = state.baseH * state.zoom;
      var drawX = (PREVIEW_SIZE - drawW) / 2 + state.panX;
      var drawY = (PREVIEW_SIZE - drawH) / 2 + state.panY;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(currentImg, drawX, drawY, drawW, drawH);

      // Darken outside the circular avatar crop boundary.
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.62)";
      ctx.beginPath();
      ctx.rect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2 - 4, 0, Math.PI * 2, true);
      ctx.fill();

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (zoomValue) {
        zoomValue.textContent = state.zoom.toFixed(2) + "x";
      }
    }

    function resetView() {
      if (!currentImg) return;
      var scale = Math.max(PREVIEW_SIZE / currentImg.naturalWidth, PREVIEW_SIZE / currentImg.naturalHeight);
      state.baseW = currentImg.naturalWidth * scale;
      state.baseH = currentImg.naturalHeight * scale;
      state.zoom = 1;
      state.panX = 0;
      state.panY = 0;
      zoomInput.value = "1";
      draw();
    }

    zoomInput.addEventListener("input", function () {
      state.zoom = Math.max(1, Math.min(4, Number(zoomInput.value) || 1));
      draw();
    });

    canvas.addEventListener("wheel", function (event) {
      if (!currentImg) return;
      event.preventDefault();
      var delta = event.deltaY < 0 ? 0.12 : -0.12;
      state.zoom = Math.max(1, Math.min(4, Number((state.zoom + delta).toFixed(2))));
      zoomInput.value = String(state.zoom);
      draw();
    }, { passive: false });

    canvas.addEventListener("pointerdown", function (event) {
      if (!currentImg) return;
      state.dragging = true;
      state.pointerId = event.pointerId;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", function (event) {
      if (!state.dragging || event.pointerId !== state.pointerId) return;
      state.panX += event.clientX - state.lastX;
      state.panY += event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      draw();
    });

    function endDrag(event) {
      if (state.dragging && event.pointerId === state.pointerId) {
        state.dragging = false;
        state.pointerId = null;
      }
    }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    canvas.addEventListener("keydown", function (event) {
      if (!currentImg) return;
      var step = event.shiftKey ? 16 : 6;
      if (event.key === "ArrowLeft") { state.panX -= step; }
      else if (event.key === "ArrowRight") { state.panX += step; }
      else if (event.key === "ArrowUp") { state.panY -= step; }
      else if (event.key === "ArrowDown") { state.panY += step; }
      else { return; }
      event.preventDefault();
      draw();
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", resetView);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        dialog.close("cancel");
      });
    }

    dialog.addEventListener("close", function () {
      var val = dialog.returnValue;
      dialog.returnValue = "";
      if (val !== "confirm") {
        currentImg = null;
      }
    });

    saveBtn.addEventListener("click", async function () {
      if (!currentImg) return;
      saveBtn.disabled = true;
      saveBtn.textContent = "Optimizing & Uploading...";
      try {
        var result = await encodeOptimizedAvatar(currentImg, state);
        if (onConfirm) {
          await onConfirm(result);
        }
        currentImg = null;
        dialog.close("confirm");
      } catch (err) {
        if (onError) {
          onError(err.message || "Could not process image.");
        }
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Crop & Upload";
      }
    });

    return {
      openFile: async function (file) {
        if (!file) return;
        if (!/^image\/(jpeg|png|webp|gif|bmp|avif)$/i.test(file.type)) {
          if (onError) onError("Please choose a valid image file (JPEG, PNG, WebP, GIF, or AVIF).");
          return;
        }
        if (file.size > MAX_INPUT_BYTES) {
          if (onError) onError("Source image must be 15 MB or smaller.");
          return;
        }
        try {
          currentImg = await loadImageFromFile(file);
          resetView();
          if (metaEl) {
            metaEl.textContent = "Source: " + currentImg.naturalWidth + "×" + currentImg.naturalHeight +
              " px -> Output: " + OUTPUT_SIZE + "×" + OUTPUT_SIZE + " px WebP (compressed)";
          }
          dialog.showModal();
        } catch (err) {
          if (onError) onError(err.message || "Could not open image.");
        }
      }
    };
  }

  window.sclAvatarCropper = {
    init: initAvatarCropper
  };
})();
