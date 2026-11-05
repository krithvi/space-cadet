/* The ship's radio (Off duty, on About).
   - Each station is a YouTube playlist, or one long mix video with time marks; today's song is
     the entry for today's date, moving one song down the list each day (see _data/radio.yml).
   - ▶ plays a 30-second snippet (from the song's `at` time if you set one, otherwise its first 30 seconds), then a burst of soft static,
     then the next station. ◀◀ / ▶▶ retune by hand.
   - The YouTube player only loads after the first press of ▶, so the page stays fast and nothing
     plays on its own. It stays visible while playing, as YouTube's rules require.
   - Radio Mirchi after dark: between the hours in radio.yml, that station plays your recorded
     message instead of a song (only once `secret.audio` points to a real file). */
(function () {
  'use strict';
  var root = document.getElementById('radio');
  var dataEl = document.getElementById('radio-data');
  if (!root || !dataEl) return;

  var data = JSON.parse(dataEl.textContent || '{}');
  var stations = data.stations || [];
  var secret = data.secret || {};
  if (!stations.length) return;

  var SNIPPET_MS = 30000;
  var $ = function (id) { return document.getElementById(id); };
  var ui = {
    freq: $('radio-freq'), name: $('radio-name'), air: $('radio-air'),
    song: $('radio-song'), artist: $('radio-artist'),
    play: $('radio-play'), prev: $('radio-prev'), next: $('radio-next'),
    needle: $('radio-needle'), idle: $('radio-idle'), player: $('radio-player'),
    marks: root.querySelectorAll('.radio-mark')
  };

  var i = Math.max(0, stations.findIndex(function (s) { return String(s.freq) === String(data.start); }));
  var playing = false;          // the visitor wants sound
  var mode = 'off';             // off | youtube | secret
  var yt = null, ytReady = false, wantIndex = false, wantSeek = false;
  var timer = null, timerStarted = 0, timerLeft = SNIPPET_MS;
  var audio = null;
  var nowSong = null;           // { song, artist } once a track has loaded

  // Local day number, so the song changes at the visitor's midnight.
  var today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

  function listId(v) {
    if (!v) return '';
    var m = String(v).match(/[?&]list=([A-Za-z0-9_-]+)/);
    return m ? m[1] : String(v).trim();
  }
  function videoId(v) {
    var m = String(v || '').match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(String(v || '').trim()) ? String(v).trim() : '');
  }
  // "1:36" or "1:02:05" → seconds
  function secs(t) {
    return String(t || '0').split(':').reduce(function (acc, n) { return acc * 60 + (parseFloat(n) || 0); }, 0);
  }
  function isMix(k) { var s = stations[k]; return !!(videoId(s.video) && s.tracks && s.tracks.length); }
  function hasMusic(k) { return !!listId(stations[k].playlist) || isMix(k) || secretActive(k); }
  // A playlist song's fix entry (start time / clean names), matched by its link
  function fixFor(k, id) {
    var list = stations[k].fix || [];
    for (var n = 0; n < list.length; n++) if (videoId(list[n].link) === id) return list[n];
    return null;
  }
  function secretActive(k) {
    if (!secret.audio || String(stations[k].freq) !== String(secret.station)) return false;
    var h = new Date().getHours(), from = +secret.from, to = +secret.to;
    return from > to ? (h >= from || h < to) : (h >= from && h < to);
  }

  // "The Weeknd - Out of Time (Official Video)" → { song: "Out of Time", artist: "The Weeknd" }
  function tidy(title, author) {
    var t = String(title || '')
      .replace(/\s*[\(\[][^\)\]]*(official|video|audio|lyric|lyrics|visuali[sz]er|hd|4k|remaster|mv)[^\)\]]*[\)\]]/gi, '')
      .replace(/\s*\|.*$/, '').trim();
    var a = String(author || '').replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();
    var dash = t.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (dash) return { song: dash[2].trim(), artist: dash[1].trim() };
    return { song: t || 'Unknown track', artist: a };
  }

  /* ── Display ─────────────────────────────────────────────────────── */
  function render() {
    var s = stations[i];
    var secretOn = mode === 'secret';
    ui.freq.textContent = secretOn ? '▓▓.▓' : s.freq;
    ui.name.textContent = secretOn ? 'incoming transmission' : s.name;
    var markerLeft = ui.marks[i] ? ui.marks[i].style.left : '50%';
    ui.needle.style.left = markerLeft;
    for (var k = 0; k < ui.marks.length; k++) ui.marks[k].classList.toggle('is-current', k === i);

    if (secretOn) {
      ui.song.textContent = secret.title || 'Incoming transmission';
      ui.artist.textContent = secret.artist || '';
    } else if (!hasMusic(i)) {
      ui.song.textContent = 'Coming soon';
      ui.artist.textContent = '\u00a0';
    } else if (nowSong && mode === 'youtube') {
      ui.song.textContent = nowSong.song;
      ui.artist.textContent = nowSong.artist;
    } else {
      ui.song.textContent = playing ? 'Tuning in…' : 'Tune in';
      ui.artist.textContent = '\u00a0';   // keeps the line's height so nothing jumps
    }

    ui.air.classList.toggle('is-on', playing);
    ui.play.textContent = playing ? '❚❚' : '▶';
    ui.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    ui.play.setAttribute('aria-pressed', playing ? 'true' : 'false');
    root.classList.toggle('is-playing', playing && mode === 'youtube');
    root.classList.toggle('is-secret', mode === 'secret');
    ui.idle.textContent = mode === 'secret' ? '' : (!hasMusic(i) ? 'Coming soon' : 'Off air · press ▶ to tune in');
  }

  /* ── Soft static between stations ────────────────────────────────── */
  var actx = null;
  function crackle() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var len = Math.floor(actx.sampleRate * 0.3);
      var buf = actx.createBuffer(1, len, actx.sampleRate);
      var d = buf.getChannelData(0);
      for (var k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len);
      var src = actx.createBufferSource(); src.buffer = buf;
      var band = actx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 1800; band.Q.value = 0.7;
      var gain = actx.createGain(); gain.gain.value = 0.06;
      src.connect(band); band.connect(gain); gain.connect(actx.destination);
      src.start();
    } catch (e) { /* no audio context: skip the static */ }
  }

  /* ── Snippet timer ───────────────────────────────────────────────── */
  function startTimer(ms) {
    clearTimeout(timer);
    timerLeft = ms; timerStarted = Date.now();
    timer = setTimeout(function () { step(1, true); }, ms);
  }
  function pauseTimer() {
    if (!timer) return;
    clearTimeout(timer); timer = null;
    timerLeft = Math.max(1000, timerLeft - (Date.now() - timerStarted));
  }

  /* ── YouTube ─────────────────────────────────────────────────────── */
  function loadYouTube(cb) {
    if (window.YT && window.YT.Player) return cb();
    var prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prevReady) prevReady(); cb(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }

  function playYouTube() {
    var mix = isMix(i);
    var list = mix ? '' : listId(stations[i].playlist);
    mode = 'youtube'; nowSong = null; wantIndex = !mix; wantSeek = true;
    render();
    function start() {
      if (mix) {                                              // start straight at today's snippet
        var tr = stations[i].tracks;
        yt.loadVideoById({ videoId: videoId(stations[i].video), startSeconds: secs(tr[today % tr.length].at) });
      }
      else yt.cuePlaylist({ listType: 'playlist', list: list });
    }
    loadYouTube(function () {
      if (!yt) {
        yt = new YT.Player('radio-player', {
          host: 'https://www.youtube-nocookie.com',
          width: '100%', height: '100%',
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: function () { ytReady = true; if (playing) start(); },
            onStateChange: onYtState,
            onError: function () { if (playing) step(1, true); }   // a song that can't be embedded: move on
          }
        });
      } else if (ytReady) {
        start();
      }
    });
  }

  // Where today's snippet starts, and what the display says
  function placeSnippet() {
    if (isMix(i)) {                                           // mix video: each track's `at` is where its 30 seconds begin
      var tr = stations[i].tracks, t = tr[today % tr.length];
      yt.seekTo(secs(t.at), true);
      nowSong = { song: t.song || 'Unknown track', artist: t.artist || '' };
      return;
    }
    var v = yt.getVideoData ? yt.getVideoData() : {};
    var fix = fixFor(i, v.video_id);
    if (fix && fix.at) yt.seekTo(secs(fix.at), true);          // otherwise it plays from the start
    nowSong = tidy(v.title, v.author);
    if (fix && fix.song) nowSong.song = fix.song;
    if (fix && fix.artist) nowSong.artist = fix.artist;
  }

  function onYtState(e) {
    if (e.data === YT.PlayerState.CUED && wantIndex) {
      wantIndex = false;
      var ids = yt.getPlaylist() || [];
      if (!ids.length) { if (playing) step(1, true); return; }
      if (playing) yt.playVideoAt(today % ids.length);
    } else if (e.data === YT.PlayerState.PLAYING) {
      if (wantSeek) {
        wantSeek = false;
        placeSnippet();
        render();
        startTimer(SNIPPET_MS);
      } else if (!timer && playing) {
        startTimer(timerLeft);                    // resumed from the player's own controls
      }
    } else if (e.data === YT.PlayerState.PAUSED) {
      pauseTimer();
    } else if (e.data === YT.PlayerState.ENDED) {
      if (playing && !wantSeek) step(1, true);
    }
  }

  /* ── The after-dark transmission ─────────────────────────────────── */
  function playSecret() {
    mode = 'secret';
    if (yt && ytReady) yt.pauseVideo();
    clearTimeout(timer); timer = null;
    audio = audio || new Audio(secret.audio);
    audio.currentTime = 0;
    audio.onended = function () { if (playing) step(1, true); };
    audio.play().catch(function () {});
    render();
  }
  function stopSecret() { if (audio) audio.pause(); }

  /* ── Controls ────────────────────────────────────────────────────── */
  function tune() {
    stopSecret();
    if (!playing) { mode = 'off'; render(); return; }
    if (secretActive(i)) playSecret();
    else playYouTube();
  }

  // Move to the next (dir 1) or previous (dir -1) station. While auto-playing, skip stations with no music yet.
  function step(dir, auto) {
    var tries = stations.length;
    do { i = (i + dir + stations.length) % stations.length; tries--; }
    while (auto && playing && !hasMusic(i) && tries > 0);
    if (playing) crackle();
    nowSong = null;
    tune();
  }

  ui.play.addEventListener('click', function () {
    if (!hasMusic(i) && !playing) {
      // nothing on this dial position yet: hop to the nearest station that has music
      var k = i, tries = stations.length;
      do { k = (k + 1) % stations.length; tries--; } while (!hasMusic(k) && tries > 0);
      if (!hasMusic(k)) { render(); return; }      // no playlists added yet
      i = k;
    }
    playing = !playing;
    if (!playing) {
      pauseTimer();
      if (yt && ytReady) yt.pauseVideo();
      stopSecret();
      render();
      return;
    }
    if (mode === 'youtube' && yt && ytReady && nowSong) {   // resume where it paused
      yt.playVideo(); startTimer(timerLeft); render(); return;
    }
    tune();
  });
  ui.next.addEventListener('click', function () { step(1, false); });
  ui.prev.addEventListener('click', function () { step(-1, false); });

  render();
})();
