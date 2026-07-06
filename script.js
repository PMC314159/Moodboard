const $ = (id) => document.getElementById(id);

const inputs = {
  artist: $('artist'),
  pairName: $('pairName'),
  charA: $('charA'),
  charB: $('charB'),
  quote: $('quote'),
  tags: $('tags'),
  song: $('song'),
  memo: $('memo'),
  imageInput: $('imageInput'),
  singleImageInput: $('singleImageInput'),
  posX: $('posX'),
  posY: $('posY'),
  zoom: $('zoom'),
};

const preview = {
  artist: $('previewArtist'),
  title: $('previewTitle'),
  charA: $('previewCharA'),
  charB: $('previewCharB'),
  quote: $('previewQuote'),
  tags: $('previewTags'),
  song: $('previewSong'),
  memo: $('previewMemo'),
  palette: $('previewPalette'),
  moodboard: $('moodboard'),
};

const colorInputs = [...document.querySelectorAll('.colorPick')];
const photos = [...document.querySelectorAll('.photo')];
const draggableEls = [...document.querySelectorAll('.draggable')];
const selectedInfo = $('selectedInfo');

const defaultLayout = new Map();
let selectedPhotoIndex = null;
let uploadedImages = Array(6).fill(null);
let crop = Array.from({ length: 6 }, () => ({ x: 0, y: 0, z: 100 }));

function safeText(value, fallback) { return value.trim() || fallback; }

function rememberDefaultLayout() {
  draggableEls.forEach((el) => {
    const rect = {
      left: parseFloat(getComputedStyle(el).left) || el.offsetLeft,
      top: parseFloat(getComputedStyle(el).top) || el.offsetTop,
      transform: getComputedStyle(el).transform === 'none' ? '' : getComputedStyle(el).transform,
    };
    defaultLayout.set(el.dataset.key, rect);
  });
}

function renderText() {
  preview.artist.textContent = safeText(inputs.artist.value, 'Commission by Artist');
  const pairName = safeText(inputs.pairName.value, 'UNTITLED');
  preview.title.textContent = pairName;
  preview.charA.textContent = safeText(inputs.charA.value, 'Character A');
  preview.charB.textContent = safeText(inputs.charB.value, 'Character B');
  preview.quote.textContent = safeText(inputs.quote.value, 'Write your quote here.');
  preview.song.textContent = safeText(inputs.song.value, 'Theme Song · Artist');
  preview.memo.textContent = safeText(inputs.memo.value, '작은 메모를 적어줘.');

  const tagList = inputs.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
  preview.tags.innerHTML = '';
  (tagList.length ? tagList : ['keyword']).forEach((tag) => {
    const span = document.createElement('span');
    span.textContent = tag;
    preview.tags.appendChild(span);
  });
}

function renderPalette() {
  const colors = colorInputs.map((input) => input.value);
  document.documentElement.style.setProperty('--p1', colors[0]);
  document.documentElement.style.setProperty('--p2', colors[1]);
  document.documentElement.style.setProperty('--p3', colors[2]);
  document.documentElement.style.setProperty('--p4', colors[3]);

  preview.palette.innerHTML = '';
  colors.forEach((color) => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = color;
    preview.palette.appendChild(swatch);
  });
}

function renderImages() {
  photos.forEach((photo, index) => {
    photo.innerHTML = '';
    if (uploadedImages[index]) {
      photo.classList.remove('placeholder');
      const img = document.createElement('img');
      img.src = uploadedImages[index];
      img.alt = `uploaded mood ${index + 1}`;
      applyCrop(img, crop[index]);
      photo.appendChild(img);
    } else {
      photo.classList.add('placeholder');
      const span = document.createElement('span');
      span.textContent = String(index + 1).padStart(2, '0');
      photo.appendChild(span);
    }
  });
  syncSelectedPhotoUI();
}

function applyCrop(img, data) {
  img.style.transform = `translate(${data.x}px, ${data.y}px) scale(${data.z / 100})`;
}

function readFileAsDataURL(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.readAsDataURL(file);
}

function handleBulkUpload(event) {
  const files = [...event.target.files].slice(0, 6);
  files.forEach((file, index) => {
    readFileAsDataURL(file, (src) => {
      uploadedImages[index] = src;
      crop[index] = { x: 0, y: 0, z: 100 };
      renderImages();
    });
  });
}

function handleSingleUpload(event) {
  if (selectedPhotoIndex === null) return;
  const file = event.target.files?.[0];
  if (!file) return;
  readFileAsDataURL(file, (src) => {
    uploadedImages[selectedPhotoIndex] = src;
    crop[selectedPhotoIndex] = { x: 0, y: 0, z: 100 };
    renderImages();
  });
  event.target.value = '';
}

function selectPhoto(index) {
  selectedPhotoIndex = index;
  photos.forEach((photo) => photo.classList.toggle('selected', Number(photo.dataset.index) === index));
  syncSelectedPhotoUI();
}

function syncSelectedPhotoUI() {
  if (selectedPhotoIndex === null) {
    selectedInfo.textContent = '사진칸을 눌러 선택';
    inputs.posX.value = 0;
    inputs.posY.value = 0;
    inputs.zoom.value = 100;
    return;
  }
  selectedInfo.textContent = `${selectedPhotoIndex + 1}번 사진칸 선택됨`;
  inputs.posX.value = crop[selectedPhotoIndex].x;
  inputs.posY.value = crop[selectedPhotoIndex].y;
  inputs.zoom.value = crop[selectedPhotoIndex].z;
}

function updateSelectedCrop() {
  if (selectedPhotoIndex === null) return;
  crop[selectedPhotoIndex] = {
    x: Number(inputs.posX.value),
    y: Number(inputs.posY.value),
    z: Number(inputs.zoom.value),
  };
  const img = photos[selectedPhotoIndex].querySelector('img');
  if (img) applyCrop(img, crop[selectedPhotoIndex]);
}

function makeDraggable(el) {
  let startX = 0, startY = 0, startLeft = 0, startTop = 0, moved = false;

  el.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    moved = false;
    const boardRect = preview.moodboard.getBoundingClientRect();
    const scale = preview.moodboard.offsetWidth / boardRect.width;
    startX = event.clientX * scale;
    startY = event.clientY * scale;
    startLeft = parseFloat(el.style.left || getComputedStyle(el).left || el.offsetLeft);
    startTop = parseFloat(el.style.top || getComputedStyle(el).top || el.offsetTop);
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.classList.add('dragging');
    el.setPointerCapture(event.pointerId);
  });

  el.addEventListener('pointermove', (event) => {
    if (!el.classList.contains('dragging')) return;
    const boardRect = preview.moodboard.getBoundingClientRect();
    const scale = preview.moodboard.offsetWidth / boardRect.width;
    const dx = event.clientX * scale - startX;
    const dy = event.clientY * scale - startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;
  });

  el.addEventListener('pointerup', (event) => {
    el.classList.remove('dragging');
    try { el.releasePointerCapture(event.pointerId); } catch (_) {}
    if (!moved && el.classList.contains('selectable-photo')) selectPhoto(Number(el.dataset.index));
  });
}

function resetLayout() {
  draggableEls.forEach((el) => {
    const base = defaultLayout.get(el.dataset.key);
    if (!base) return;
    el.style.left = `${base.left}px`;
    el.style.top = `${base.top}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  });
}

async function saveAsPng() {
  const board = preview.moodboard;
  const originalTransform = board.style.transform;
  board.style.transform = 'none';
  document.querySelectorAll('.selected, .dragging').forEach((el) => el.classList.remove('selected', 'dragging'));

  const canvas = await html2canvas(board, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });

  board.style.transform = originalTransform;
  if (selectedPhotoIndex !== null) photos[selectedPhotoIndex].classList.add('selected');

  const link = document.createElement('a');
  const fileName = safeText(inputs.pairName.value, 'pair-moodboard').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-').toLowerCase();
  link.download = `${fileName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

Object.values(inputs).forEach((input) => {
  if (input && !['imageInput', 'singleImageInput', 'posX', 'posY', 'zoom'].includes(input.id)) {
    input.addEventListener('input', renderText);
  }
});

colorInputs.forEach((input) => input.addEventListener('input', renderPalette));
inputs.imageInput.addEventListener('change', handleBulkUpload);
inputs.singleImageInput.addEventListener('change', handleSingleUpload);
$('singleUploadBtn').addEventListener('click', () => {
  if (selectedPhotoIndex === null) selectPhoto(0);
  inputs.singleImageInput.click();
});
[inputs.posX, inputs.posY, inputs.zoom].forEach((input) => input.addEventListener('input', updateSelectedCrop));
$('saveBtn').addEventListener('click', saveAsPng);
$('resetBtn').addEventListener('click', resetLayout);
photos.forEach((photo, index) => photo.addEventListener('click', () => selectPhoto(index)));
draggableEls.forEach(makeDraggable);

rememberDefaultLayout();
renderText();
renderPalette();
renderImages();
