export default function useTheme() {
  const hexToRgb = (hex: string): string => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(' ');
    }
    return '11 14 17'; // Default fallback RGB (#0B0E11)
  };

  const adjustColor = (hex: string, amount: number): string => {
    return '#' + hex.replace(/^#/, '').replace(/../g, hex => ('0'+Math.min(255, Math.max(0, parseInt(hex, 16) + amount)).toString(16)).substr(-2));
  };

  const setPrimaryColor = (hexColor: string | undefined | null) => {
    const color = hexColor || '#0B0E11';
    const rgb = hexToRgb(color);
    
    // Lighten for hover
    const hoverColor = adjustColor(color, 20); 
    
    // Dark mode variant: lighten the color for better visibility on dark backgrounds
    const isDarkMode = document.documentElement.classList.contains('dark');
    const displayColor = isDarkMode ? adjustColor(color, 40) : color;
    const displayHoverColor = isDarkMode ? adjustColor(color, 60) : hoverColor;

    document.documentElement.style.setProperty('--color-primary', displayColor);
    document.documentElement.style.setProperty('--color-primary-rgb', hexToRgb(displayColor));
    document.documentElement.style.setProperty('--color-primary-hover', displayHoverColor);
    document.documentElement.style.setProperty('--color-primary-subtle', isDarkMode ? adjustColor(color, -40) : adjustColor(color, 150));
  };

  return {
    setPrimaryColor,
    hexToRgb,
  };
}
