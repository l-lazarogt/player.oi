(function () {
  'use strict';

  const buttons = document.querySelectorAll('[data-outside]');
  const ACTIVE_CLASS = 'is-active';
  function outsideClick(button) {
    if (!button) return;
    const target = document.getElementById(button.dataset.outside);
    if (!target) return;
    function toggleClasses() {
      button.classList.toggle(ACTIVE_CLASS);
      target.classList.toggle(ACTIVE_CLASS);
      if (button.classList.contains(ACTIVE_CLASS)) {
        document.addEventListener('click', clickOutside);
        return;
      }
      document.removeEventListener('click', clickOutside);
    }
    button.addEventListener('click', toggleClasses);
    function clickOutside(event) {
      if (!target.contains(event.target) && !button.contains(event.target)) {
        toggleClasses();
        document.removeEventListener('click', clickOutside);
      }
    }
    const closeButton = target.querySelector('[data-close]');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        button.classList.remove(ACTIVE_CLASS);
        target.classList.remove(ACTIVE_CLASS);
        document.removeEventListener('click', clickOutside);
      });
    }
  }
  function initOutsideClick() {
    buttons.forEach(button => {
      outsideClick(button);
    });
  }

  // FunciÃ³n para inicializar el lienzo (canvas)
  function initCanvas(container) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'visualizerCanvas');
    canvas.setAttribute('class', 'visualizer-item');
    container.appendChild(canvas);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return canvas;
  }

  // FunciÃ³n para cambiar el lienzo segÃºn el tamaÃ±o del contenedor
  function resizeCanvas(canvas, container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  // Visualizer
  const visualizer = (audio, container) => {
    if (!audio || !container) {
      return;
    }
    const options = {
      fftSize: container.dataset.fftSize || 2048,
      numBars: container.dataset.bars || 40,
      maxHeight: container.dataset.maxHeight || 255
    };
    const ctx = new AudioContext();
    const audioSource = ctx.createMediaElementSource(audio);
    const analyzer = ctx.createAnalyser();
    audioSource.connect(analyzer);
    audioSource.connect(ctx.destination);
    const frequencyData = new Uint8Array(analyzer.frequencyBinCount);
    const canvas = initCanvas(container);
    const canvasCtx = canvas.getContext('2d');

    // Crear barras
    const renderBars = () => {
      resizeCanvas(canvas, container);
      analyzer.getByteFrequencyData(frequencyData);
      if (options.fftSize) {
        analyzer.fftSize = options.fftSize;
      }
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < options.numBars; i++) {
        const index = Math.floor((i + 10) * (i < options.numBars / 2 ? 2 : 1));
        const fd = frequencyData[index];
        const barHeight = Math.max(4, fd || 0) + Number(options.maxHeight) / 255;
        const barWidth = canvas.width / options.numBars;
        const x = i * barWidth;
        const y = canvas.height - barHeight;
        canvasCtx.fillStyle = 'white';
        canvasCtx.fillRect(x, y, barWidth - 2, barHeight);
      }
      requestAnimationFrame(renderBars);
    };
    renderBars();

    // Listener del cambio de espacio en la ventana
    window.addEventListener('resize', () => {
      resizeCanvas(canvas, container);
    });
  };

  const API_KEY_LYRICS = '1637b78dc3b129e6843ed674489a92d0';
  const cache = {};

  // Iconos de Meteor Icons: https://meteoricons.com/
  const icons = {
    play: '<svg class="i i-play" viewBox="0 0 24 24"><path d="m7 3 14 9-14 9z"></path></svg>',
    pause: '<svg class="i i-pause" viewBox="0 0 24 24"><path d="M5 4h4v16H5Zm10 0h4v16h-4Z"></path></svg>',
    facebook: '<svg class="i i-facebook" viewBox="0 0 24 24"><path d="M17 14h-3v8h-4v-8H7v-4h3V7a5 5 0 0 1 5-5h3v4h-3q-1 0-1 1v3h4Z"></path></svg>',
    twitter: '<svg class="i i-x" viewBox="0 0 24 24"><path d="m3 21 7.5-7.5m3-3L21 3M8 3H3l13 18h5Z"></path></svg>',
    instagram: '<svg class="i i-instagram" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><rect width="20" height="20" x="2" y="2" rx="5"></rect><path d="M17.5 6.5h0"></path></svg>',
    youtube: '<svg class="i i-youtube" viewBox="0 0 24 24"><path d="M1.5 17q-1-5.5 0-10Q1.9 4.8 4 4.5q8-1 16 0 2.1.3 2.5 2.5 1 4.5 0 10-.4 2.2-2.5 2.5-8 1-16 0-2.1-.3-2.5-2.5Zm8-8.5v7l6-3.5Z"></path></svg>',
    tiktok: '<svg class="i i-tiktok" viewBox="0 0 24 24"><path d="M22 6v5q-4 0-6-2v7a7 7 0 1 1-5-6.7m0 6.7a2 2 0 1 0-2 2 2 2 0 0 0 2-2V1h5q2 5 6 5"></path></svg>',
    whatsapp: '<svg class="i i-whatsapp" viewBox="0 0 24 24"><circle cx="9" cy="9" r="1"></circle><circle cx="15" cy="15" r="1"></circle><path d="M8 9a7 7 0 0 0 7 7m-9 5.2A11 11 0 1 0 2.8 18L2 22Z"></path></svg>',
    telegram: '<svg class="i i-telegram" viewBox="0 0 24 24"><path d="M12.5 16 9 19.5 7 13l-5.5-2 21-8-4 18-7.5-7 4-3"></path></svg>',
    tv: '<svg class="i i-tv" viewBox="0 0 24 24"><rect width="22" height="15" x="1" y="3" rx="3"></rect><path d="M7 21h10"></path></svg>',
    ios: '<svg class="i i-apple" viewBox="0 0 24 24"><path d="M12 3q2 0 2-2-2 0-2 2M8 6C0 6 3 22 8 22q2 0 3-.5t2 0q1 .5 3 .5 3 0 4.5-6a1 1 0 0 1-.5-7.5Q19 6 16 6q-1 0-2.5.5t-3 0Q9 6 8 6"></path></svg>',
    android: '<svg class="i i-google-play" viewBox="0 0 24 24"><path d="M6.8 2.2a2.5 2.5 0 0 0-3.8 2v15.6a2.5 2.5 0 0 0 3.8 2L21 13.7a2 2 0 0 0 0-3.4ZM3.2 3.5l12.8 13m-12.8 4L16 7.5"></path></svg>'
  };
  const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P//PxcACQYDCF0ysWYAAAAASUVORK5CYII=';
  const changeImageSize = (url, size) => url.replace(/100x100/, size);

  // Obtener Datos desde Stream Africa
  const getDataFromStreamAfrica = async (artist, title, defaultArt, defaultCover) => {
    let text;
    if (artist === null || artist === title) {
      text = `${title} - ${title}`;
    } else {
      text = `${artist} - ${title}`;
    }
    const cacheKey = text.toLowerCase();
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }
    const API_URL = `https://api.streamafrica.net/new.search.php?query=${encodeURIComponent(text)}&service=spotify`;
    const response = await fetch(API_URL);
    if (title === 'LA JEFA GREENVILLE' || response.status === 403) {
      const results = {
        title,
        artist,
        art: defaultArt,
        cover: defaultCover,
        stream_url: '#not-found'
      };
      cache[cacheKey] = results;
      return results;
    }
    const data = response.ok ? await response.json() : {};
    if (!data.results || data.results.length === 0) {
      const results = {
        title,
        artist,
        art: defaultArt,
        cover: defaultCover,
        stream_url: '#not-found'
      };
      cache[cacheKey] = results;
      return results;
    }
    const stream = data.results;
    const results = {
      title: stream.title || title,
      artist: stream.artist || artist,
      thumbnail: stream.artwork || defaultArt,
      art: stream.artwork || defaultArt,
      cover: stream.artwork || defaultCover,
      stream_url: stream.stream_url || '#not-found'
    };
    cache[cacheKey] = results;
    return results;
  };

  // Obtener Datos desde iTunes
  const getDataFromITunes = async (artist, title, defaultArt, defaultCover) => {
    let text;
    if (artist === title) {
      text = `${title}`;
    } else {
      text = `${artist} - ${title}`;
    }
    const cacheKey = text.toLowerCase();
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    // SyntaxError: Unexpected end of JSON input
    const response = await fetch(`https://itunes.apple.com/search?limit=1&term=${encodeURIComponent(text)}`);
    if (response.status === 403) {
      const results = {
        title,
        artist,
        art: defaultArt,
        cover: defaultCover,
        stream_url: '#not-found'
      };
      return results;
    }
    const data = response.ok ? await response.json() : {};
    if (!data.results || data.results.length === 0) {
      const results = {
        title,
        artist,
        art: defaultArt,
        cover: defaultCover,
        stream_url: '#not-found'
      };
      return results;
    }
    const itunes = data.results[0];
    const results = {
      title: itunes.trackName || title,
      artist: itunes.artistName || artist,
      thumbnail: itunes.artworkUrl100 || defaultArt,
      art: itunes.artworkUrl100 ? changeImageSize(itunes.artworkUrl100, '600x600') : defaultArt,
      cover: itunes.artworkUrl100 ? changeImageSize(itunes.artworkUrl100, '1500x1500') : defaultCover,
      stream_url: '#not-found'
    };
    cache[cacheKey] = results;
    return results;
  };

  // Determinar de donde obtener los datos
  async function getDataFrom({
    artist,
    title,
    art,
    cover,
    server
  }) {
    let dataFrom = {};
    if (server.toLowerCase() === 'spotify') {
      dataFrom = await getDataFromStreamAfrica(artist, title, art, cover);
    } else {
      dataFrom = await getDataFromITunes(artist, title, art, cover);
    }
    return dataFrom;
  }

  // Obtener letras de canciones
  const getLyrics = async (artist, name) => {
    try {
      const response = await fetch(`https://api.vagalume.com.br/search.php?apikey=${API_KEY_LYRICS}&art=${encodeURIComponent(artist)}&mus=${encodeURIComponent(name)}`);
      const data = await response.json();
      if (data.type === 'exact' || data.type === 'aprox') {
        const lyrics = data.mus[0].text;
        return lyrics;
      } else {
        return 'Not found lyrics';
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      return 'Not found lyrics';
    }
  };

  // Crear un elemento HTML a partir de una cadena de texto
  function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  // Eliminar elementos innecesarios del texto
  function sanitizeText(text) {
    return text.replace(/^\d+\.\)\s/, '').replace(/<br>$/, '');
  }

  // Normalizar historial
  function normalizeHistory(api) {
    let artist;
    let song;
    const history = api.song_history || api.history || api.songHistory || [];
    const historyNormalized = history.map(item => {
      if (api.song_history) {
        artist = item.song.artist;
        song = item.song.title;
      } else if (api.history) {
        artist = sanitizeText(item.split(' - ')[0] || item);
        song = sanitizeText(item.split(' - ')[1] || item);
      } else if (api.songHistory) {
        artist = item.artist;
        song = item.title;
      }
      return {
        artist,
        song
      };
    });
    return historyNormalized;
  }
  function createTempImage(src) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'Anonymous';
      img.src = `https://images.weserv.nl/?url=${src}`;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }
  function normalizeTitle(api) {
    let title;
    let artist;
    if (api.now_playing) {
      title = api.now_playing.song.title;
      artist = api.now_playing.song.artist;
    } else if (api.artist && api.title) {
      title = api.title;
      artist = api.artist;
    } else if (api.currenttrack_title) {
      title = api.currenttrack_title;
      artist = api.currenttrack_artist;
    } else if (api.title && api.djprofile && api.djusername) {
      title = api.title.split(' - ')[1];
      artist = api.title.split(' - ')[0];
    } else {
      title = api.currentSong;
      artist = api.currentArtist;
    }
    return {
      title,
      artist
    };
  }

  // Iniciar la aplicaciÃ³n
  function initApp() {
    console.log('Streamaa', window.streama);
    if (window.streama) return;
    window.streama = true;
    initOutsideClick();
    function play(audio, newSource = null) {
      if (newSource) {
        audio.src = newSource;
      }

      // Visualizer
      if (!hasVisualizer) {      
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // None
        } else {
            visualizer(audio, visualizerContainer);
            hasVisualizer = true;
        }
      }
      
      audio.load();
      audio.play();
      playButton.innerHTML = icons.pause;
      playButton.classList.add('is-active');
    }
    function pause(audio) {
      audio.pause();
      playButton.innerHTML = icons.play;
      playButton.classList.remove('is-active');
    }

    // BotÃ³n play/pause, al pausar detener el stream, al reproducir iniciar el stream de nuevo
    // playButton, play, pause son funciones exportadas que se usaran en otros archivos
    const range = document.querySelector('.player-volume');
    const rangeFill = document.querySelector('.player-range-fill');
    const rangeWrapper = document.querySelector('.player-range-wrapper');
    const rangeThumb = document.querySelector('.player-range-thumb');
    const currentVolume = localStorage.getItem('volume') || 100;

    // Rango recorrido
    function setRangeWidth(percent) {
      {
        rangeFill.style.height = `${percent}%`;
      }
    }

    // PosiciÃ³n del thumb
    function setThumbPosition(percent) {
      const compensatedWidth = rangeWrapper.offsetHeight - rangeThumb.offsetHeight ;
      const thumbPosition = percent / 100 * compensatedWidth;
      {
        rangeThumb.style.bottom = `${thumbPosition}px`;
      }
    }

    // Actualiza el volumen al cambiar el rango
    function updateVolume(audio, value) {
      range.value = value;
      setRangeWidth(value);
      setThumbPosition(value);
      localStorage.setItem('volume', value);
      audio.volume = value / 100;
    }
    const playButton = document.querySelector('.player-button-play');
    
    const visualizerContainer = document.querySelector('.visualizer');
    let hasVisualizer = false;
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    if (playButton !== null) {
      playButton.addEventListener('click', async () => {
        if (audio.paused) {
          play(audio);
        } else {
          pause(audio);
        }
      });
    }

    // Valor inicial
    if (range !== null) {
      updateVolume(audio, currentVolume);

      // Escucha el cambio del rango
      range.addEventListener('input', event => {
        updateVolume(audio, event.target.value);
      });

      // Escucha el movimiento del mouse
      rangeThumb.addEventListener('mousedown', () => {
        document.addEventListener('mousemove', handleThumbDrag);
      });
    }

    // Mueve el thumb y actualiza el volumen
    function handleThumbDrag(event) {
      const rangeRect = range.getBoundingClientRect();
      const click = event.clientY - rangeRect.top;
      let percent = click / range.offsetWidth * 100;
      percent = 100 - percent;
      percent = Math.max(0, Math.min(100, percent));
      const value = Math.round((range.max - range.min) * (percent / 100)) + parseInt(range.min);
      updateVolume(audio, value);
    }

    // Deja de escuchar el movimiento del mouse
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleThumbDrag);
    });
    window.addEventListener('resize', () => {
      const currentPercent = range.value;
      setRangeWidth(currentPercent);
      setThumbPosition(currentPercent);
    });

    // ----------------------------------------------
    // Resto del cÃ³digo
    // ----------------------------------------------

    const songNow = document.querySelector('.song-now');
    const stationsList = document.getElementById('stations');
    const stationName = document.querySelector('.station-name');
    const stationDescription = document.querySelector('.station-description');
    const playerArtwork = document.querySelector('.player-artwork img:first-child');
    const playerCoverImg = document.querySelector('.player-cover-image');
    const lyricsContent = document.getElementById('lyrics');
    const playerTv = document.querySelector('.online-tv');
    const playerTvModal = document.getElementById('modal-tv');
    const playerSocial = document.querySelector('.player-social');
    const history = document.getElementById('history');
    const historyTemplate = `<div class="history-item flex items-center g-0.75">
<div class="history-image flex-none">
  <img src="{{art}}" width="80" height="80">
</div>
<div class="history-meta flex column">
  <span class="color-title fw-500 truncate-line">{{song}}</span>
  <span class="color-text">{{artist}}</span>
</div>
<a href="{{stream_url}}" class="history-spotify" target="_blank" rel="noopener">
  <svg class="i i-spotify" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11"></circle>
    <path d="M6 8q7-2 12 1M7 12q5.5-1.5 10 1m-9 3q4.5-1.5 8 1"></path>
  </svg>
</a>
</div>`;
    const API_URL = 'https://api.streamafrica.net/metadata/index.php?z=';
    const TIME_TO_REFRESH = window?.streams?.timeRefresh || 10000;
    let currentStation;
    let activeButton;
    function setAssetsInPage(station) {
      playerArtwork && (playerArtwork.src = station.album);
      playerCoverImg && (playerCoverImg.src = station.cover || station.album);
      stationName.textContent = station.name;
      stationDescription.textContent = station.description;
      playerTv && (playerTv.innerHTML = '');
      if (station.tv_url && playerTv) {
        createOpenTvButton(station.tv_url);
      }
      if (playerSocial) {
        playerSocial.innerHTML = '';
      }
      if (station.social && playerSocial) {
        Object.keys(station.social).forEach(key => {
          playerSocial.appendChild(createSocialItem(station.social[key], key));
        });
      }
    }
    function createSocialItem(url, icon) {
      const $a = document.createElement('a');
      $a.classList.add('player-social-item');
      $a.href = url;
      $a.target = '_blank';
      $a.innerHTML = icons[icon];
      return $a;
    }
    function createOpenTvButton(url) {
      const $button = document.createElement('button');
      $button.classList.add('player-button', 'player-button-tv');
      $button.innerHTML = icons.tv + 'Tv';
      $button.addEventListener('click', () => {
        $button.blur();
        const modalBody = playerTvModal.querySelector('.modal-body-video');
        const closeButton = playerTvModal.querySelector('[data-close]');
        if ($button.classList.contains('is-active')) {
          playerTvModal.classList.remove('is-active');
          $button.classList.remove('is-active');
          modalBody.innerHTML = '';
          return;
        }
        $button.classList.add('is-active');
        playerTvModal.classList.add('is-active');
        
        pause(audio);
        
        const $iframe = document.createElement('iframe');
        $iframe.src = url;
        $iframe.allowFullscreen = true;
        modalBody.appendChild($iframe);
        
        closeButton.addEventListener('click', () => {
          $button.classList.remove('is-active');
          playerTvModal.classList.remove('is-active');
          play(audio);
          modalBody.innerHTML = '';
        });
      });
      playerTv.appendChild($button);
    }
    function setAccentColor(image, colorThief) {
      const dom = document.querySelector('.app-player');
      const metaThemeColor = document.querySelector('meta[name=theme-color]');
      if (image.complete) {
        dom.setAttribute('style', `--accent: rgb(${colorThief.getColor(image)})`);
        metaThemeColor.setAttribute('content', `rgb(${colorThief.getColor(image)})`);
      } else {
        image.addEventListener('load', function () {
          dom.setAttribute('style', `--accent: rgb(${colorThief.getColor(image)})`);
          metaThemeColor.setAttribute('content', `rgb(${colorThief.getColor(image)})`);
        });
      }
    }
    function createStations(stations, currentStation, audio, callback) {
      if (!stationsList) return;
      stationsList.innerHTML = '';
      stations.forEach(async (station, index) => {
        const $fragment = document.createDocumentFragment();
        const $button = createStreamItem(station, index, currentStation, audio, callback);
        $fragment.appendChild($button);
        stationsList.appendChild($fragment);
      });
    }
    function createStreamItem(station, index, currentStation, audio, callback) {
      const $button = document.createElement('button');
      $button.classList.add('station');
      $button.innerHTML = `<img class="station-img" src="${station.album}" alt="station" height="160" width="160">`;
      $button.dataset.index = index;
      $button.dataset.hash = station.hash;
      if (currentStation.stream_url === station.stream_url) {
        $button.classList.add('is-active');
        activeButton = $button;
      }
      $button.addEventListener('click', () => {
        if ($button.classList.contains('is-active')) return;

        // Eliminar la clase "active" del botÃ³n activo anterior, si existe
        if (activeButton) {
          activeButton.classList.remove('is-active');
        }
        const playerStation = document.querySelector('.player-station img:first-child');
        if (playerStation) {
          playerStation.src = station.album;
        }

        // Agregar la clase "active" al botÃ³n actualmente presionado
        $button.classList.add('is-active');
        activeButton = $button; // Actualizar el botÃ³n activo

        setAssetsInPage(station);
        play(audio, station.stream_url);
        if (history) {
          history.innerHTML = '';
        }

        // Llamar a la funciÃ³n de devoluciÃ³n de llamada (callback) si se proporciona
        if (typeof callback === 'function') {
          callback(station);
        }
      });
      return $button;
    }

    // Cargar datos de la canciÃ³n actual al navegador
    function mediaSession(data) {
      const {
        title,
        artist,
        album,
        art
      } = data;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album,
          artwork: [{
            src: art,
            sizes: '512x512',
            type: 'image/png'
          }]
        });
        navigator.mediaSession.setActionHandler('play', () => {
          play();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          pause();
        });
      }
    }
    function playerCustomPlay() {
      const playButton = document.querySelector('.player-custom-play');
      if (playButton) {
        playButton.addEventListener('click', () => {
          if (!audio.paused) {
            return;
          }
          play(audio);
        });
      }
    }

    // Establecer datos de la canciÃ³n actual
    function currentSong(data) {
      const content = songNow;
      const songTitle = content.querySelector('.song-title');
      const songName = document.querySelectorAll('.song-name');
      const songArtist = document.querySelectorAll('.song-artist');
      const playerModalImage = document.querySelector('.player-modal-image');
      const socialFacebook = document.querySelector('.social-facebook');
      const socialTwitter = document.querySelector('.social-twitter');
      const socialWhatsapp = document.querySelector('.social-whatsapp');
      socialFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${data.website}`;
      socialTwitter.href = `https://twitter.com/intent/tweet?text=${data.shareFullText}`;
      socialWhatsapp.href = `https://api.whatsapp.com/send?text=${data.shareFullText}`;
      songName.forEach(item => {
        item.textContent = data.title;
      });
      songArtist.forEach(item => {
        item.textContent = data.artist;
      });
      songTitle.classList.remove('is-scrolling');
      songTitle.removeAttribute('style');
      if (songTitle.scrollWidth > songTitle.offsetWidth) {
        songTitle.classList.add('is-scrolling');
        const scroll = songTitle.scrollWidth - songTitle.offsetWidth;
        const speed = scroll / 10;
        songTitle.setAttribute('style', `--text-scroll: -${scroll}px; --text-scroll-duration: ${speed}s`);
      } else {
        songTitle.classList.remove('is-scrolling');
        songTitle.removeAttribute('style');
      }
      const artwork = content.querySelector('.player-artwork');
      const playerLeft = document.querySelector('.player-left');
      if (artwork) {
        const $img = document.createElement('img');
        $img.src = data.art;
        $img.width = 600;
        $img.height = 600;
        playerModalImage.src = data.art;
        playerLeft.style.removeProperty('--artwork');
        playerLeft.style.setProperty('--artwork', `url(${data.art})`);

        // Cuando la imagen se haya cargado, insertarla en artwork
        $img.addEventListener('load', () => {
          artwork.appendChild($img);

          // eslint-disable-next-line no-undef
          const colorThief = new ColorThief();

          // Ejecutar cada vez que cambie la imagen
          // Crear una imagen temporal para evitar errores de CORS
          createTempImage($img.src).then(img => {
            setAccentColor(img, colorThief);
          });

          // Animar la imagen para desplazarla hacia la izquierda con transform
          setTimeout(() => {
            artwork.querySelectorAll('img').forEach(img => {
              // Establecer la transiciÃ³n
              img.style.transform = `translateX(${-img.width}px)`;

              // Esperar a que la animaciÃ³n termine
              img.addEventListener('transitionend', () => {
                // Eliminar todas las imÃ¡genes excepto la Ãºltima
                artwork.querySelectorAll('img:not(:last-child)').forEach(img => {
                  img.remove();
                });
                img.style.transition = 'none';
                img.style.transform = 'none';
                setTimeout(() => {
                  img.removeAttribute('style');
                }, 1000);
              });
            });
          }, 100);
        });
      }
      if (playerCoverImg) {
        const tempImg = new Image();
        tempImg.src = data.cover || data.art;
        tempImg.addEventListener('load', () => {
          playerCoverImg.style.opacity = 0;

          // Esperar a que la animaciÃ³n termine
          playerCoverImg.addEventListener('transitionend', () => {
            playerCoverImg.src = data.cover || data.art;
            playerCoverImg.style.opacity = 1;
          });
        });
      }
    }

    // Establecer las canciones que se han reproducido
    function setHistory(data, current, server) {
      if (!history) return;
      history.innerHTML = historyTemplate.replace('{{art}}', pixel).replace('{{song}}', 'Cargando historial...').replace('{{artist}}', 'Artista').replace('{{stream_url}}', '#not-found');
      if (!data) return;

      // max 10 items
      data = data.slice(0, 10);
      const promises = data.map(async item => {
        const {
          artist,
          song
        } = item;
        const {
          album,
          cover
        } = current;
        const dataFrom = await getDataFrom({
          artist,
          title: song,
          art: album,
          cover,
          server
        });
        return historyTemplate.replace('{{art}}', dataFrom.thumbnail || dataFrom.art).replace('{{song}}', dataFrom.title).replace('{{artist}}', dataFrom.artist).replace('{{stream_url}}', dataFrom.stream_url);
      });
      Promise.all(promises).then(itemsHTML => {
        const $fragment = document.createDocumentFragment();
        itemsHTML.forEach(itemHTML => {
          $fragment.appendChild(createElementFromHTML(itemHTML));
        });
        history.innerHTML = '';
        history.appendChild($fragment);
      }).catch(error => {
        console.error('Error:', error);
      });
    }
    function setLyrics(artist, title) {
      if (!lyricsContent) return;
      getLyrics(artist, title).then(lyrics => {
        const $p = document.createElement('p');
        $p.innerHTML = lyrics.replace(/\n/g, '<br>');
        lyricsContent.innerHTML = '';
        lyricsContent.appendChild($p);
      }).catch(error => {
        console.error('Error:', error);
      });
    }

    // Variables para almacenar informaciÃ³n que se actualizarÃ¡
    let currentSongPlaying;
    let timeoutId;
    const json = window.streams || {};
    const stations = json.stations;
    currentStation = stations[0];

    // Establecer los assets de la pÃ¡gina
    setAssetsInPage(currentStation);

    // Establecer la fuente de audio
    audio.src = '';
    audio.src = currentStation.stream_url;

    // Iniciar el stream
    function init(current) {
      // Cancelar el timeout anterior
      if (timeoutId) clearTimeout(timeoutId);

      // Si la url de la estaciÃ³n actual es diferente a la estaciÃ³n actual, se actualiza la informaciÃ³n
      if (currentStation.stream_url !== current.stream_url) {
        currentStation = current;
      }
      playerCustomPlay();
      const server = currentStation.server || 'itunes';
      const jsonUri = currentStation.api || API_URL + encodeURIComponent(current.stream_url);
      fetch(jsonUri).then(response => response.json()).then(async res => {
        const current = normalizeTitle(res);

        // Si currentSong es diferente a la canciÃ³n actual, se actualiza la informaciÃ³n
        const title = current.title;
        if (currentSongPlaying !== title) {
          // Actualizar la canciÃ³n actual
          currentSongPlaying = title;
          let artist = current.artist;
          const art = currentStation.album;
          const cover = currentStation.cover;
          const history = normalizeHistory(res);
          artist = title === artist ? null : artist;
          const dataFrom = await getDataFrom({
            artist,
            title,
            art,
            cover,
            server: 'itunes'
          });
          const website = window.location.origin;
          dataFrom.website = website;
          dataFrom.shareFullText = encodeURIComponent(`Escuchando ${title || currentStation.name} en ${currentStation.name} ${website}`);

          // Establecer datos de la canciÃ³n actual
          currentSong(dataFrom);
          mediaSession(dataFrom);
          setLyrics(dataFrom.artist, dataFrom.title);
          setHistory(history, currentStation, server);
        }
      }).catch(error => console.log(error));
      timeoutId = setTimeout(() => {
        init(current);
      }, TIME_TO_REFRESH);
    }
    init(currentStation);
    createStations(stations, currentStation, audio, station => {
      init(station);
    });
    const nextStation = document.querySelector('.player-button-forward-step');
    const prevStation = document.querySelector('.player-button-backward-step');
    if (nextStation) {
      nextStation.addEventListener('click', () => {
        const next = stationsList.querySelector('.is-active').nextElementSibling;
        if (next) {
          next.click();
        }
      });
    }
    if (prevStation) {
      prevStation.addEventListener('click', () => {
        const prev = stationsList.querySelector('.is-active').previousElementSibling;
        if (prev) {
          prev.click();
        }
      });
    }
  }
  initApp();

})();