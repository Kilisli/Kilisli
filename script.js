document.addEventListener('DOMContentLoaded', () => {
    const channelListElement = document.getElementById('channel-list');
    const playerElement = document.getElementById('my-video');
    const menuToggle = document.getElementById('menu-toggle');
    const channelMenu = document.getElementById('channel-menu');

    const player = videojs(playerElement, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        playbackRates: [1, 1.25, 1.5, 2]
    });

    async function fetchM3UChannels(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            parseM3U(text);
        } catch (err) {
            console.error('M3U yüklenemedi', err);
        }
    }

    function parseM3U(m3u) {
        const lines = m3u.split('\n');
        let channels = [], current = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('#EXTINF:')) {
                const name = line.split(',').pop().trim();
                current = { name };
            } else if (line.startsWith('http')) {
                current.url = line;
                channels.push(current);
            }
        }

        listChannels(channels);
        if (channels.length) playChannel(channels[0].url, channels[0].name);
    }

    function listChannels(channels) {
        channelListElement.innerHTML = '';
        channels.forEach(channel => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = channel.name;
            a.href = '#';
            a.dataset.url = channel.url;
            a.onclick = (e) => {
                e.preventDefault();
                playChannel(channel.url, channel.name, a);
                if (window.innerWidth <= 768) channelMenu.classList.remove('open');
            };
            li.appendChild(a);
            channelListElement.appendChild(li);
        });
    }

    function playChannel(url, name, activeEl) {
        player.src({ src: url, type: 'application/x-mpegURL' });
        player.play();
        document.querySelectorAll('#channel-list a').forEach(el => el.classList.remove('active'));
        if (activeEl) activeEl.classList.add('active');
    }

    menuToggle.onclick = () => {
        channelMenu.classList.toggle('open');
    };

    fetchM3UChannels('channels.txt'); // Not: GitHub Pages'te .txt olması daha sağlıklı
});
