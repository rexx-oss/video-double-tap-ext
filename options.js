document.addEventListener('DOMContentLoaded', () => {
  const s = document.getElementById('s');
  const v = document.getElementById('v');
  const b = document.getElementById('b');
  const storage = chrome.storage.sync || chrome.storage.local;

  storage.get({ seekSeconds: 10 }, (res) => {
    s.value = res.seekSeconds;
    v.textContent = res.seekSeconds;
  });

  s.addEventListener('input', () => { v.textContent = s.value; });
  b.addEventListener('click', () => {
    storage.set({ seekSeconds: parseInt(s.value, 10) }, () => {
      b.textContent = 'Saved!';
      setTimeout(() => { b.textContent = 'Save'; }, 1500);
    });
  });
});
