/* Minimal site JS: mobile nav, intro video dialog, and dataLayer events for GTM.
 *
 * Tracking events pushed to window.dataLayer (create GTM "Custom Event" triggers for these):
 *   book_call_click      – any "Book a Free Strategy Call" button
 *   intro_video_click    – "Watch My Introduction" / video thumbnail
 *   intro_video_open     – video dialog actually opened with a video
 *   whatsapp_click       – WhatsApp links
 *   email_click          – mailto: links
 *   phone_click          – tel: links
 *   linkedin_click       – LinkedIn links
 *   upwork_click         – Upwork profile links
 *   fiverr_click         – Fiverr profile links
 *   youtube_click        – YouTube channel links
 *   instagram_click      – Instagram profile links
 *   facebook_click       – Facebook profile links
 *   x_click              – X (Twitter) profile links
 *   threads_click        – Threads profile links
 *   case_study_click     – "View Case Study" buttons
 *   cta_click            – other tracked CTAs
 *   contact_form_submit  – contact form submitted (fires before redirect)
 *   generate_lead        – thank-you page view after a successful form submission (use as the primary conversion)
 * Every event includes cta_location, cta_id, cta_text and page_path.
 */
;(function () {
  var dl = (window.dataLayer = window.dataLayer || [])
  var push = function (event, data) {
    var payload = { event: event, page_path: location.pathname }
    for (var k in data) payload[k] = data[k]
    dl.push(payload)
  }

  // Click tracking (delegated). Explicit data-track-event wins; otherwise infer from href.
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button')
    if (!el) return
    var ev = el.getAttribute('data-track-event')
    var href = el.getAttribute('href') || ''
    if (!ev) {
      if (href.indexOf('mailto:') === 0) ev = 'email_click'
      else if (href.indexOf('tel:') === 0) ev = 'phone_click'
      else if (/wa\.me|whatsapp\.com/.test(href)) ev = 'whatsapp_click'
      else if (/calendly\.com/.test(href)) ev = 'book_call_click'
      else if (/linkedin\.com/.test(href)) ev = 'linkedin_click'
      else if (/upwork\.com/.test(href)) ev = 'upwork_click'
      else if (/fiverr\.com/.test(href)) ev = 'fiverr_click'
      else if (/youtube\.com|youtu\.be/.test(href)) ev = 'youtube_click'
      else if (/instagram\.com/.test(href)) ev = 'instagram_click'
      else if (/facebook\.com/.test(href)) ev = 'facebook_click'
      else if (/x\.com|twitter\.com/.test(href)) ev = 'x_click'
      else if (/threads\.(com|net)/.test(href)) ev = 'threads_click'
    }
    if (!ev || el.type === 'submit') return
    push(ev, {
      cta_location: el.getAttribute('data-track-location') || 'inline',
      cta_id: el.id || '',
      cta_text: (el.textContent || '').trim().slice(0, 80),
      link_url: href,
    })
  })

  // Contact form
  document.querySelectorAll('form.js-lead-form').forEach(function (form) {
    form.addEventListener('submit', function () {
      var need = form.querySelector('[name="message"]')
      push(form.getAttribute('data-track-event') || 'contact_form_submit', {
        cta_location: form.getAttribute('data-track-location') || '',
        form_name: form.getAttribute('name'),
        has_website: !!(form.querySelector('[name="website"]') || {}).value,
        message_length: need ? need.value.length : 0,
      })
      try { sessionStorage.setItem('lead_submitted', '1') } catch (_) {}
      var src = form.querySelector('[name="source_page"]')
      if (src && document.referrer) src.value = location.pathname + ' (from ' + document.referrer + ')'
    })
  })

  // Thank-you page conversion (only once per real submission)
  var conv = document.querySelector('meta[name="conversion"]')
  if (conv) {
    var submitted = false
    try { submitted = sessionStorage.getItem('lead_submitted') === '1'; sessionStorage.removeItem('lead_submitted') } catch (_) {}
    if (submitted) push('generate_lead', { lead_type: conv.content })
  }

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle')
  var nav = document.getElementById('site-nav')
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open))
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
      document.body.classList.toggle('nav-open', open)
    }
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true') })
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false) })
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false) })
  }

  // Intro video dialog – the iframe is only created on open (no third-party load until requested).
  var dialog = document.getElementById('video-dialog')
  if (dialog && typeof dialog.showModal === 'function') {
    var frame = dialog.querySelector('.video-frame')
    var src = frame.getAttribute('data-src')
    var open = function () {
      if (src && !frame.querySelector('iframe')) {
        var f = document.createElement('iframe')
        f.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1'
        f.title = 'Meet Tahmid — introduction video'
        f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
        f.allowFullscreen = true
        frame.appendChild(f)
        push('intro_video_open', {})
      }
      dialog.showModal()
    }
    var close = function () {
      dialog.close()
    }
    dialog.addEventListener('close', function () {
      var f = frame.querySelector('iframe')
      if (f) f.remove()
    })
    document.querySelectorAll('.js-video-open').forEach(function (b) { b.addEventListener('click', open) })
    dialog.querySelectorAll('.js-video-close').forEach(function (b) { b.addEventListener('click', close) })
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close() })
  }

  // Header scroll state transition
  var header = document.querySelector('.site-header')
  if (header) {
    var checkScroll = function () {
      header.classList.toggle('is-scrolled', (window.pageYOffset || document.documentElement.scrollTop) > 20)
    }
    window.addEventListener('scroll', checkScroll, { passive: true })
    checkScroll()
  }

  // Dark & Light Theme Management
  var initTheme = function () {
    var getPreferredTheme = function () {
      try {
        var saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') return saved;
      } catch (_) {}
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    };

    var applyTheme = function (theme, animate) {
      if (animate) {
        document.documentElement.classList.add('theme-transition');
      }
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (_) {}

      var isDark = theme === 'dark';
      document.querySelectorAll('.js-theme-toggle').forEach(function (btn) {
        btn.setAttribute('aria-label', isDark ? 'Switch to Light theme' : 'Switch to Dark theme');
        btn.setAttribute('title', isDark ? 'Switch to Light theme' : 'Switch to Dark theme');
      });

      if (animate) {
        setTimeout(function () {
          document.documentElement.classList.remove('theme-transition');
        }, 320);
      }
    };

    var currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    applyTheme(currentTheme, false);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.js-theme-toggle');
      if (!btn) return;
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var nextTheme = cur === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme, true);
      push('theme_toggle', { theme: nextTheme, cta_location: 'header' });
    });

    if (window.matchMedia) {
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
          if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light', true);
          }
        });
      } catch (_) {}
    }
  };
  initTheme();
})()
