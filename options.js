document.addEventListener('DOMContentLoaded', () => {
  const seekSlider = document.getElementById('seekSeconds');
  const valDisplay = document.getElementById('valDisplay');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  const storage = chrome.storage.sync || chrome.storage.local;

  storage.get({ seekSeconds: 10 }, (res) => {
    seekSlider.value = res.seekSeconds;
    valDisplay.textContent = res.seekSeconds;
  });

  seekSlider.addEventListener('input', () => {
    valDisplay.textContent = seekSlider.value;
  });

  saveBtn.addEventListener('click', () => {
    storage.set({ seekSeconds: parseInt(seekSlider.value, 10) }, () => {
      status.textContent = 'Saved successfully!';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
  });
});