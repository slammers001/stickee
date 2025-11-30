import { type PluginCreator } from 'tailwindcss/types/config';

const textSizeFix: PluginCreator = ({ addBase }) => {
  addBase({
    'html': {
      '-webkit-text-size-adjust': '100%',
      'text-size-adjust': '100%',
    }
  });
};

export default textSizeFix;
