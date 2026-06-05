// Runs synchronously before React mounts — prevents flash of wrong theme and missing favicon.
(function () {
  try {
    // Dark mode: apply class before first paint to prevent FOUC
    if (localStorage.getItem('joepdf_dark') === '1') {
      document.documentElement.classList.add('dark')
    }
  } catch (e) {}
  try {
    // Branded favicon: inject from localStorage so bookmarks show the right icon
    var fav = localStorage.getItem('joepdf_favicon')
    if (fav) {
      var l = document.createElement('link')
      l.rel = 'icon'
      l.href = fav
      document.head.appendChild(l)
    }
  } catch (e) {}
})()
