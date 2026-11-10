module.exports = {
  content: ['./*.html'],
  theme: { extend: {
    colors: { brand: { lime:'#B9E62E', dark:'#070514', card:'#120b2e', violet:'#5B21B6', violetGlow:'#7C3AED', text:'#F1ECFB', muted:'#B3A9CC', line:'#3A2F5E' } },
    fontFamily: { body: ['Archivo','system-ui','sans-serif'] },
    boxShadow: { 'brutal-violet':'5px 5px 0 0 #5B21B6', 'glow-lime':'0 0 28px rgba(185,230,46,.4)' }
  } },
  plugins: [require('@tailwindcss/forms')]
};
