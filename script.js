const $ = (id) => document.getElementById(id);

const inputs = {
  pairName: $('pairName'),
  charA: $('charA'),
  charB: $('charB'),
  quote: $('quote'),
  tags: $('tags'),
  song: $('song'),
  memo: $('memo'),
  imageInput: $('imageInput'),
};

const preview = {
  pairName: $('previewPairName'),
  title: $('previewTitle'),
  charA: $('previewCharA'),
  charB: $('previewCharB'),
  quote: $('previewQuote'),
  tags: $('previewTags'),
  song: $('previewSong'),
  memo: $('previewMemo'),
  palette: $('previewPalette'),
  moodboard: $('moodboard'),
  imageGrid: $('imageGrid'),
};

const colorInputs = [...document.querySelectorAll('.colorPick')];
const defaultPhotos = [...document.querySelectorAll('.photo')];
let uploadedImages = [];

function safeText(value, fallback) {
  return value.trim() || fallback;
}

function renderText() {
  const pairName = safeText(inputs.pairName.value, 'UNTITLED');
  preview.pairName.textContent = pairName;
  preview.title.textContent = pairName;
  preview.charA.textContent = safeText(inputs.charA.value, 'Character A');
  preview.charB.textContent = safeText(inputs.charB.value, 'Character B');
  preview.quote.textContent = safeText(inputs.quote.value, 'Write your quote here.');
  preview.song.textContent = safeText(inputs.song.value, 'Theme Song · Artist');
  preview.memo.textContent = safeText(inputs.memo.value, '작은 메모를 적어주세요.');

  const tagList = inputs.tags.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);

  preview.tags.innerHTML = '';
  if (tagList.length === 0) tagList.push('keyword');
  tagList.forEach((tag) => {
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
  defaultPhotos.forEach((photo, index) => {
    photo.innerHTML = '';
    if (uploadedImages[index]) {
      photo.classList.remove('placeholder');
      const img = document.createElement('img');
      img.src = uploadedImages[index];
      img.alt = `uploaded mood ${index + 1}`;
      photo.appendChild(img);
    } else {
      photo.classList.add('placeholder');
      const span = document.createElement('span');
      span.textContent = String(index + 1).padStart(2, '0');
      photo.appendChild(span);
    }
  });
}

function handleImageUpload(event) {
  const files = [...event.target.files].slice(0, 8);
  uploadedImages = [];

  if (files.length === 0) {
    renderImages();
    return;
  }

  let loaded = 0;
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages[index] = e.target.result;
      loaded += 1;
      if (loaded === files.length) renderImages();
    };
    reader.readAsDataURL(file);
  });
}

async function saveAsPng() {
  const board = preview.moodboard;
  const originalTransform = board.style.transform;
  board.style.transform = 'none';

  const canvas = await html2canvas(board, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });

  board.style.transform = originalTransform;

  const link = document.createElement('a');
  const fileName = safeText(inputs.pairName.value, 'pair-moodboard')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  link.download = `${fileName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function toggleLayout() {
  preview.moodboard.classList.toggle('layout-b');
}

Object.values(inputs).forEach((input) => {
  if (input !== inputs.imageInput) input.addEventListener('input', renderText);
});

colorInputs.forEach((input) => input.addEventListener('input', renderPalette));
inputs.imageInput.addEventListener('change', handleImageUpload);
$('saveBtn').addEventListener('click', saveAsPng);
$('randomBtn').addEventListener('click', toggleLayout);

renderText();
renderPalette();
renderImages();
