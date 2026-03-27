(function () {
  'use strict';

  var defaultColors = {
    background: '#074ea2',
    letters: '#ffffff',
    cloud: '#074ea2',
    cloudBorder: '#ffffff',
    photon: '#ec8aff',
    euFlag: '#074ea2',
    euFrame: '#ffffff',
    euStars: '#fff200'
  };

  var colors = Object.assign({}, defaultColors);

  var showEuLogo = true;

  // ── helpers ─────────────────────────────────────────────────────────────────

  function rgbToHex(str) {
    if (!str || str === 'none') return null;
    if (str.charAt(0) === '#') return str;
    var m = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (!m) return null;
    return '#' + [m[1], m[2], m[3]].map(function (n) {
      return ('0' + parseInt(n, 10).toString(16)).slice(-2);
    }).join('');
  }

  function setSwatchColor(key, hex) {
    var swatch = document.getElementById('swatch-' + key);
    var hexLabel = document.getElementById('hex-' + key);
    var input = document.getElementById('picker-' + key);
    if (swatch) swatch.style.backgroundColor = hex;
    if (hexLabel) hexLabel.textContent = hex.toUpperCase();
    if (input) input.value = hex;
  }

  // ── apply colors to SVG ──────────────────────────────────────────────────────

  function applyColors() {
    var svg = document.getElementById('grail-logo-svg');
    if (!svg) return;

    // Background
    var bg = svg.querySelector('#grail-bg');
    if (bg) bg.style.fill = colors.background;

    // Letters + decorative bars (fill)
    svg.querySelectorAll('.grail-letters').forEach(function (el) {
      el.style.fill = colors.letters;
    });

    // Letter paths that also carry a stroke (the A halves)
    svg.querySelectorAll('.grail-letters-stroke').forEach(function (el) {
      el.style.fill = colors.letters;
      el.style.stroke = colors.letters;
    });

    // Cloud: fill only; stroke follows letters
    var cloud = svg.querySelector('#grail-cloud');
    if (cloud) {
      cloud.style.fill = colors.cloud;
      cloud.style.stroke = colors.cloudBorder;
    }

    // Photon fill
    svg.querySelectorAll('.grail-photon').forEach(function (el) {
      el.style.fill = colors.photon;
    });

    // Photon stroked paths (fill:none, stroke=photon)
    svg.querySelectorAll('.grail-photon-stroke').forEach(function (el) {
      el.style.stroke = colors.photon;
    });

    // EU flag background
    var euFlagBg = svg.querySelector('#eu-flag-bg');
    if (euFlagBg) euFlagBg.style.fill = colors.euFlag;

    // EU frame (outer border rect + text paths)
    svg.querySelectorAll('.eu-frame').forEach(function (el) {
      el.style.fill = colors.euFrame;
    });

    // EU stars
    svg.querySelectorAll('.eu-stars').forEach(function (el) {
      el.style.fill = colors.euStars;
    });
  }

  // ── color pickers ────────────────────────────────────────────────────────────

  var pickerDefs = [
    { key: 'background', label: 'Background' },
    { key: 'letters',    label: 'Letters & Blocks' },
    { key: 'cloud',       label: 'Cloud interior' },
    { key: 'cloudBorder', label: 'Cloud boundary' },
    { key: 'photon',      label: 'Photon' },
    { key: 'euFlag',      label: 'EU flag background' },
    { key: 'euFrame',     label: 'EU frame & text' },
    { key: 'euStars',     label: 'EU stars' }
  ];

  function initPickers() {
    pickerDefs.forEach(function (def) {
      setSwatchColor(def.key, colors[def.key]);

      var row   = document.getElementById('row-'    + def.key);
      var input = document.getElementById('picker-' + def.key);
      var dot   = document.getElementById('default-' + def.key);
      if (!row || !input) return;

      // Clicking the row (but not the default dot) opens the colour picker
      row.addEventListener('click', function (e) {
        if (dot && dot.contains(e.target)) return;
        input.click();
      });

      input.addEventListener('input', function (e) {
        colors[def.key] = e.target.value;
        setSwatchColor(def.key, e.target.value);
        applyColors();
      });

      // Default-colour dot: click resets to original value
      if (dot) {
        dot.style.backgroundColor = defaultColors[def.key];
        dot.title = 'Reset to original (' + defaultColors[def.key].toUpperCase() + ')';
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          colors[def.key] = defaultColors[def.key];
          setSwatchColor(def.key, defaultColors[def.key]);
          applyColors();
        });
      }
    });
  }

  // ── EU logo toggle ───────────────────────────────────────────────────────────

  // The background rect lives inside <g transform="matrix(0.822163,0,0,1,0,0)">.
  // getBBox() on #grail-main-content returns coordinates in Artboard1 space.
  // Background left edge in Artboard1 = 0 (no x-translation in that transform).
  // So left margin = bbox.x, and we set the new right edge = bbox.right + bbox.x (symmetric).
  // Converting back to the rect's own coordinate space: divide by the group's x-scale (0.822163).
  var BG_SCALE_X = 0.822163;
  var BG_ORIGINAL_WIDTH = 3070.866;

  function adjustBackground() {
    var svg = document.getElementById('grail-logo-svg');
    var bgRect = svg && svg.querySelector('#grail-bg');
    if (!bgRect) return;

    if (showEuLogo) {
      bgRect.setAttribute('width', BG_ORIGINAL_WIDTH);
    } else {
      var blocks = svg.querySelector('#grail-blocks');
      if (!blocks) return;
      var bbox = blocks.getBBox();           // Artboard1 units
      var leftMargin = bbox.x;              // background left edge is 0
      var newRightArtboard = bbox.x + bbox.width + leftMargin;
      bgRect.setAttribute('width', newRightArtboard / BG_SCALE_X);
    }
  }

  function initEuToggle() {
    var toggle = document.getElementById('eu-toggle');
    if (!toggle) return;
    toggle.checked = showEuLogo;
    toggle.addEventListener('change', function () {
      showEuLogo = toggle.checked;
      var euGroup = document.getElementById('grail-eu-logo');
      if (euGroup) euGroup.style.display = showEuLogo ? '' : 'none';
      var euSection = document.getElementById('eu-colors-section');
      if (euSection) euSection.classList.toggle('eu-disabled', !showEuLogo);
      adjustBackground();
    });
  }

  // ── download SVG ─────────────────────────────────────────────────────────────

  function downloadSVG() {
    var svg = document.getElementById('grail-logo-svg');
    if (!svg) return;

    // Read the background rect's current width (may be reduced when EU is hidden)
    var bgRect = svg.querySelector('#grail-bg');
    var bgRectW = bgRect ? parseFloat(bgRect.getAttribute('width')) : BG_ORIGINAL_WIDTH;
    var cropW = bgRectW * BG_X_TO_VIEWPORT;

    // Clone and set viewBox to background-rect bounds so the SVG is already cropped
    var clone = svg.cloneNode(true);
    clone.setAttribute('viewBox', '0 ' + BG_CROP_Y + ' ' + cropW + ' ' + BG_CROP_HEIGHT);
    clone.setAttribute('width',  cropW);
    clone.setAttribute('height', BG_CROP_HEIGHT);

    var str = new XMLSerializer().serializeToString(clone);
    var blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'grail_logo.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ── download PNG ──────────────────────────────────────────────────────────────
  // The background rect lives inside two nested transforms:
  //   Artboard1  matrix(1.047892,0,0,1,0,0)  → x scale 1.047892
  //   BG group   matrix(0.822163,0,0,1,0,0)  → x scale 0.822163
  // Combined x scale to SVG viewport units: 1.047892 × 0.822163 ≈ 0.86155
  // The rect's y=472.441 and height=1322.835 are unscaled (no y transforms).
  var BG_X_TO_VIEWPORT = 1.047892 * 0.822163;
  var BG_CROP_Y      = 472.441;
  var BG_CROP_HEIGHT = 1322.835;

  function downloadPNG() {
    var btn = document.getElementById('btn-png');
    if (btn) { btn.disabled = true; btn.textContent = 'Rendering…'; }

    var svg = document.getElementById('grail-logo-svg');
    if (!svg) return;

    // Read the background rect's current width (may be reduced when EU is hidden)
    var bgRect = svg.querySelector('#grail-bg');
    var bgRectW = bgRect ? parseFloat(bgRect.getAttribute('width')) : BG_ORIGINAL_WIDTH;

    var cropX = 0;
    var cropY = BG_CROP_Y;
    var cropW = bgRectW * BG_X_TO_VIEWPORT;
    var cropH = BG_CROP_HEIGHT;

    // Serialise the current SVG state (all inline colour overrides included)
    var serializer = new XMLSerializer();
    var svgStr = serializer.serializeToString(svg);
    var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    var svgW = 3676, svgH = 2481;
    var full = document.createElement('canvas');
    full.width  = svgW;
    full.height = svgH;

    var img = new Image();
    img.onload = function () {
      full.getContext('2d').drawImage(img, 0, 0, svgW, svgH);
      URL.revokeObjectURL(url);

      // Crop to background rect bounds
      var out = document.createElement('canvas');
      out.width  = Math.round(cropW);
      out.height = Math.round(cropH);
      out.getContext('2d').drawImage(full,
        cropX, cropY, cropW, cropH,
        0, 0, out.width, out.height);

      out.toBlob(function (pngBlob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = 'grail_logo.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        if (btn) { btn.disabled = false; btn.textContent = 'Download PNG'; }
      }, 'image/png');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      alert('PNG generation failed — could not render SVG to canvas.');
      if (btn) { btn.disabled = false; btn.textContent = 'Download PNG'; }
    };
    img.src = url;
  }

  // ── download colors JSON ─────────────────────────────────────────────────────

  function downloadColorsJSON() {
    var payload = Object.assign({}, colors, { showEuLogo: showEuLogo });
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'grail_colors.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ── load colors from JSON ────────────────────────────────────────────────────

  function loadColorsJSON(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var loaded = JSON.parse(e.target.result);
        ['background', 'letters', 'cloud', 'cloudBorder', 'photon', 'euFlag', 'euFrame', 'euStars'].forEach(function (k) {
          if (loaded[k]) {
            colors[k] = loaded[k];
            setSwatchColor(k, loaded[k]);
          }
        });
        if (typeof loaded.showEuLogo === 'boolean') {
          showEuLogo = loaded.showEuLogo;
          var toggle = document.getElementById('eu-toggle');
          if (toggle) toggle.checked = showEuLogo;
          var euGroup = document.getElementById('grail-eu-logo');
          if (euGroup) euGroup.style.display = showEuLogo ? '' : 'none';
        }
        applyColors();
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }

  // ── toolbar wiring ───────────────────────────────────────────────────────────

  function initToolbar() {
    var btnSvg = document.getElementById('btn-svg');
    var btnPng = document.getElementById('btn-png');
    var btnSaveJson = document.getElementById('btn-save-json');
    var btnLoadJson = document.getElementById('btn-load-json');
    var fileInput = document.getElementById('file-json-input');

    if (btnSvg) btnSvg.addEventListener('click', downloadSVG);
    if (btnPng) btnPng.addEventListener('click', downloadPNG);
    if (btnSaveJson) btnSaveJson.addEventListener('click', downloadColorsJSON);

    if (btnLoadJson && fileInput) {
      btnLoadJson.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files[0]) {
          loadColorsJSON(fileInput.files[0]);
          fileInput.value = '';
        }
      });
    }
  }

  // ── init ─────────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    initPickers();
    initEuToggle();
    initToolbar();
    applyColors();
  });

})();
