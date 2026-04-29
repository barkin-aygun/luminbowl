function createSplatter(cell) {
  const s = document.createElement('div');
  s.className = 'splatter';

  const rand = (min, max) => Math.random() * (max - min) + min;

  // Main impact blob
  const main = document.createElement('div');
  main.className = 'splat-blob';
  const mainSize = rand(50, 75);
  main.style.width = mainSize + '%';
  main.style.height = mainSize + '%';
  main.style.left = rand(10, 40) + '%';
  main.style.top = rand(10, 40) + '%';
  main.style.borderRadius = `${rand(40,60)}% ${rand(30,55)}% ${rand(40,65)}% ${rand(35,60)}%`;
  s.appendChild(main);

  // Smaller satellite blobs
  const blobCount = Math.floor(rand(4, 8));
  for (let i = 0; i < blobCount; i++) {
    const blob = document.createElement('div');
    const variant = Math.random();
    blob.className = 'splat-blob' + (variant < 0.3 ? ' dark' : variant > 0.7 ? ' light' : '');
    const size = rand(12, 35);
    blob.style.width = size + '%';
    blob.style.height = size + '%';
    blob.style.left = rand(-10, 90) + '%';
    blob.style.top = rand(-10, 90) + '%';
    blob.style.borderRadius = `${rand(30,70)}% ${rand(30,70)}% ${rand(30,70)}% ${rand(30,70)}%`;
    blob.style.opacity = rand(0.6, 0.9);
    s.appendChild(blob);
  }

  // Drips
  const dripCount = Math.floor(rand(1, 4));
  for (let i = 0; i < dripCount; i++) {
    const drip = document.createElement('div');
    drip.className = 'splat-drip';
    const w = rand(8, 18);
    drip.style.width = w + '%';
    drip.style.height = rand(25, 55) + '%';
    drip.style.left = rand(15, 75) + '%';
    drip.style.top = rand(40, 70) + '%';
    drip.style.borderRadius = `${rand(20,40)}% ${rand(20,40)}% ${rand(40,60)}% ${rand(40,60)}%`;
    s.appendChild(drip);
  }

  cell.appendChild(s);
}

export function addRandomSplatters(pitchRenderer) {
  const count = Math.floor(Math.random() * 6) + 5;
  for (let i = 0; i < count; i++) {
    const col = Math.floor(Math.random() * 24) + 2; // cols 2-25
    const row = Math.floor(Math.random() * 15) + 1;
    const cell = pitchRenderer.getCell(col, row);
    if (cell && cell.querySelectorAll('.splatter').length < 2) {
      createSplatter(cell);
    }
  }
}
