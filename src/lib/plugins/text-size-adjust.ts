import plugin from 'tailwindcss/plugin';

export const textSizeAdjust = plugin(({ addBase }) => {
  addBase({
    'html': {
      '-webkit-text-size-adjust': '100%',
      'text-size-adjust': '100%',
    }
  });
});
