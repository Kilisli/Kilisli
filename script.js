document.addEventListener('DOMContentLoaded', () => {
    const channelListElement = document.getElementById('channel-list');
    const playerElement = document.getElementById('my-video');
    const menuToggle = document.getElementById('menu-toggle');
    const channelMenu = document.getElementById('channel-menu');

    let player; // Video.js player instance

    // Video.js player'ı başlat
    // videojs-contrib-hls eklentisi otomatik olarak m3u8'i tanır
    player = videojs(playerElement, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true, // Oynatıcının responsive olmasını sağlar
        playbackRates: [0.5, 1, 1.5, 2] // Oynatma hızları
    });

    // M3U dosyasını çekme ve kanalları listeleme
    async function fetchM3UChannels(m3uUrl) {
        try {
            const response = await fetch(m3uUrl);
            if (!response.ok) {
                throw new Error(`M3U dosyası yüklenemedi: ${response.statusText}`);
            }
            const m3uText = await response.text();
            parseM3U(m3uText);
        } catch (error) {
            console.error('M3U dosyası yüklenirken hata oluştu:', error);
            channelListElement.innerHTML = `<li><a href="#">Kanallar yüklenirken hata oluştu.</a></li>`;
        }
    }

    // M3U metnini ayrıştırma
    function parseM3U(m3uText) {
        const lines = m3uText.split('\n');
        let channels = [];
        let currentChannel = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('#EXTINF:')) {
                // Kanal adını ve varsa diğer bilgileri al
                const match = line.match(/tvg-name="([^"]+)"|tvg-name='([^']+)'|([^,]+)$/);
                let channelName = "Bilinmeyen Kanal";
                if (match) {
                     channelName = match[1] || match[2] || match[3].split(',').pop().trim();
                }

                currentChannel = { name: channelName, url: '' };
            } else if (line.startsWith('http')) {
                // Kanal URL'si
                currentChannel.url = line;
                channels.push(currentChannel);
            }
        }
        displayChannels(channels);

        // Sayfa yüklendiğinde ilk kanalı otomatik oynat (isteğe bağlı)
        if (channels.length > 0) {
            playChannel(channels[0].url, channels[0].name, channelListElement.querySelector('li a'));
        }
    }

    // Kanalları menüye ekleme
    function displayChannels(channels) {
        channelListElement.innerHTML = ''; // Listeyi temizle
        channels.forEach(channel => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#'; // Sayfa yenilenmesini engelle
            link.textContent = channel.name;
            link.dataset.url = channel.url; // Kanal URL'sini data-attribute olarak sakla

            link.addEventListener('click', (e) => {
                e.preventDefault(); // Varsayılan link davranışını engelle (sayfa yenileme)
                playChannel(channel.url, channel.name, link);
                
                // Mobil menüyü kapat
                if (window.innerWidth <= 768) {
                    channelMenu.classList.remove('open');
                }
            });
            listItem.appendChild(link);
            channelListElement.appendChild(listItem);
        });
    }

    // Kanalı oynatma fonksiyonu
    function playChannel(url, name, clickedLink) {
        console.log(`Oynatılıyor: ${name} (${url})`);
        player.src({
            src: url,
            type: 'application/x-mpegURL' // HLS (m3u8) için doğru type
        });
        player.play();

        // Aktif sınıfını güncelle
        channelListElement.querySelectorAll('li a').forEach(link => {
            link.classList.remove('active');
        });
        if (clickedLink) {
            clickedLink.classList.add('active');
        }
    }

    // Menü açma/kapama (Mobil İçin)
    menuToggle.addEventListener('click', () => {
        channelMenu.classList.toggle('open');
    });

    // Sayfaya tıklanınca menüyü kapat (Mobil İçin)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && channelMenu.classList.contains('open')) {
            // Tıklanan öğe menü butonu veya menünün kendisi değilse kapat
            if (!channelMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                channelMenu.classList.remove('open');
            }
        }
    });

    // M3U dosyasını yükle
    // Not: channels.m3u dosyasının GitHub Pages'te doğru yolda olduğundan emin olun.
    // Eğer farklı bir sunucudan çekiyorsanız, CORS ayarlarını kontrol edin.
    fetchM3UChannels('channels.m3u'); 
});