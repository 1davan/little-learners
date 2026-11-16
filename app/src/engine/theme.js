// Per-world, per-level looks. Level 1/2/3 (store.level() 0..2) changes the season / time of day of a world:
//   meadow: spring morning · golden autumn · snowy winter
//   beach:  sunny noon     · pink sunset   · starry night
//   farm:   spring         · harvest       · rainy day with a rainbow
//   dressup (Home): sunny front garden · bedroom · rainy evening in the cosy room
//   map:    the world map's sea: sunny · sunset · starry night
//   build:  sunny sandpit site · brick yard at golden hour · night site with work lights
// stage.js reads the sky/light part, scenery.js the ground/props part, home.js and ui.js the accents.
export const THEMES = {
  meadow: [
    { name: 'Spring meadow', emoji: '🌷', sky: ['#5bb8f5', '#b6e4ff', '#fff1cf'], fog: 0xe6f4ea, hemi: [0xfff7e8, 0x9fd07a, 1.45], sun: [0xfff1d6, 2.5], rim: [0xcfe6ff, 1.3] },
    { name: 'Autumn meadow', emoji: '🍂', sky: ['#5ea8e6', '#ffcf94', '#ffe2b8'], fog: 0xf8dfbd, hemi: [0xfff0dc, 0xd9b86a, 1.45], sun: [0xffd6a0, 2.6], rim: [0xffd2b0, 1.2], tint: [0xff9a3c, 0.14] },
    { name: 'Snowy meadow', emoji: '⛄', sky: ['#77b9ee', '#c8e3fb', '#f4f9ff'], fog: 0xe9f1fb, hemi: [0xf4f8ff, 0xd6e3f5, 1.3], sun: [0xfff6ec, 2.2], rim: [0xcfe0ff, 1.5], tint: [0xd8ecff, 0.16] },
  ],
  beach: [
    { name: 'Sunny beach', emoji: '☀️', sky: ['#2fa9e3', '#93def5', '#ffe0b0'], fog: 0xf2ecd9, hemi: [0xfff7e8, 0xf0d59a, 1.45], sun: [0xfff1d6, 2.5], rim: [0xcfe6ff, 1.3] },
    { name: 'Sunset beach', emoji: '🌅', sky: ['#9a86dc', '#ff9fb4', '#ffd08a'], fog: 0xffc6a6, hemi: [0xffe6d6, 0xf0b98a, 1.45], sun: [0xffc8a0, 2.5], rim: [0xff9ec8, 1.6], tint: [0xff9fb0, 0.14] },
    { name: 'Night beach', emoji: '🌙', sky: ['#14205a', '#2f4597', '#6170c6'], fog: 0x34488f, hemi: [0xd2daff, 0x6a70b0, 1.55], sun: [0xeef0ff, 2.15], rim: [0x9fb8ff, 1.8], tint: [0xa8b8ff, 0.1], night: true },
  ],
  farm: [
    { name: 'Spring farm', emoji: '🌱', sky: ['#5fb4f0', '#c9ecff', '#fff0c2'], fog: 0xf3eed2, hemi: [0xfff7e8, 0xb8d98a, 1.45], sun: [0xfff1d6, 2.5], rim: [0xcfe6ff, 1.3] },
    { name: 'Harvest farm', emoji: '🎃', sky: ['#7cb0e4', '#ffd092', '#ffb879'], fog: 0xf7d9ae, hemi: [0xfff0dc, 0xd9b060, 1.45], sun: [0xffcf9a, 2.6], rim: [0xffcfa8, 1.2], tint: [0xffa040, 0.14] },
    { name: 'Rainbow farm', emoji: '🌈', sky: ['#8aa6cc', '#c3d3e8', '#eef2f7'], fog: 0xdfe6ef, hemi: [0xf0f4fb, 0x9ccf7a, 1.55], sun: [0xf6f8ff, 2.1], rim: [0xd8e6ff, 1.4], tint: [0xbcd6ff, 0.08] },
  ],
  // Home (id 'dressup'): lights stay warm and bright, since the Home games (and Dress Monkey's own room) play under them
  dressup: [
    { name: 'Sunny garden', emoji: '🌻', sky: ['#4fb2f2', '#b6e4ff', '#fff1cf'], fog: 0xeef4e2, hemi: [0xfff7e8, 0xb8dc8a, 1.45], sun: [0xfff1d6, 2.5], rim: [0xcfe6ff, 1.3] },
    { name: 'Bedroom', emoji: '🧸', sky: ['#7fb6ee', '#cfe4ff', '#fff2e4'], fog: 0xf4ecf6, hemi: [0xfff6f0, 0xe0c8d8, 1.5], sun: [0xfff0e2, 2.4], rim: [0xd6dcff, 1.3] },
    { name: 'Rainy evening', emoji: '🌧️', sky: ['#4c5a8e', '#8a90bc', '#e2c8b8'], fog: 0xeadcd0, hemi: [0xfff0dc, 0xd2b08e, 1.5], sun: [0xffe6c4, 2.3], rim: [0xc8d2ff, 1.3], tint: [0xffc890, 0.06] },
  ],
  // the building site: a sunny sandpit · a brick yard at golden hour · the site at night under big work lights
  build: [
    { name: 'Sandpit site', emoji: '🚧', sky: ['#3fa8ec', '#a8dcfb', '#fff0cc'], fog: 0xf4ead2, hemi: [0xfff7e8, 0xe9cf96, 1.45], sun: [0xfff1d6, 2.5], rim: [0xcfe6ff, 1.3] },
    { name: 'Brick yard', emoji: '🧱', sky: ['#6d8fd6', '#ffb27a', '#ffd9a0'], fog: 0xf6cfa4, hemi: [0xfff0dc, 0xd9a26a, 1.45], sun: [0xffcf98, 2.6], rim: [0xffc0a0, 1.3], tint: [0xff9a4a, 0.12] },
    { name: 'Night site', emoji: '🔦', sky: ['#121c4e', '#283d8c', '#5465b8'], fog: 0x2c3d7e, hemi: [0xe2e0ff, 0x76689a, 1.6], sun: [0xfff0d6, 2.25], rim: [0x9fb8ff, 1.8], tint: [0xa8b8ff, 0.08], night: true },
  ],
};
// The world map (home overview): a sunny sea · a golden sunset · a starry night.
THEMES.map = [
  { name: 'Sunny islands', emoji: '☀️', sky: ['#3fa8ec', '#a8dcfb', '#e8f6ff'], fog: 0xcdeefb, hemi: [0xfff7e8, 0x9fd0c0, 1.5], sun: [0xfff1d6, 2.5], rim: [0xcfe6ff, 1.3] },
  { name: 'Sunset islands', emoji: '🌅', sky: ['#8a86dc', '#ff9fb4', '#ffd08a'], fog: 0xf6c0b8, hemi: [0xffe6d6, 0xd8a8b0, 1.5], sun: [0xffc8a0, 2.5], rim: [0xff9ec8, 1.5], tint: [0xff9fb0, 0.1] },
  { name: 'Starry islands', emoji: '🌙', sky: ['#14205a', '#2f4597', '#6170c6'], fog: 0x2a3a80, hemi: [0xd2daff, 0x6a70b0, 1.6], sun: [0xeef0ff, 2.2], rim: [0x9fb8ff, 1.8], tint: [0xa8b8ff, 0.08], night: true },
];
export function theme(world = 'meadow', level = 0) {
  const w = THEMES[world] || THEMES.meadow;
  return w[Math.max(0, Math.min(2, level | 0))];
}
