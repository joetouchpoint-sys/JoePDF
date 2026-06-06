// Runs synchronously before React mounts — prevents flash of wrong theme and missing favicon.
(function () {
  try {
    // Dark mode: apply class before first paint to prevent FOUC
    if (localStorage.getItem('joepdf_dark') === '1') {
      document.documentElement.classList.add('dark')
    }
  } catch (e) {}
  try {
    // Branded favicon: inject from localStorage so bookmarks show the correct icon.
    // Must remove the static <link rel="icon"> from index.html first, otherwise
    // browsers prefer the one declared in the HTML source.
    var fav = localStorage.getItem('joepdf_favicon')
    if (fav) {
      var existing = document.querySelectorAll('link[rel*="icon"]')
      for (var i = 0; i < existing.length; i++) {
        var el = existing[i]
        if (el.parentNode) el.parentNode.removeChild(el)
      }
      var l = document.createElement('link')
      l.rel = 'icon'
      l.type = 'image/png'
      l.href = fav
      document.head.appendChild(l)
    }
  } catch (e) {}
})()
