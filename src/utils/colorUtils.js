// Helper to convert iRacing decimal color to hex
export const intToHexColor = (colorInt) => {
  if (colorInt === undefined || colorInt === null) return '#444444'; // default gray
  const hex = colorInt.toString(16).padStart(6, '0');
  return `#${hex}`;
};

// Calculate relative luminance to determine if text should be black or white
export const getContrastYIQ = (hexcolor) => {
  if (!hexcolor) return 'white';
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

// Returns styling object for iRacing license classes
export const getLicenseTheme = (licLevel, licString) => {
  const level = licLevel || 0;
  const str = licString || '';
  if (str.startsWith('R')) return { bg: '#e03131', text: '#000000' }; // Soft Ruby
  if (str.startsWith('D')) return { bg: '#e8590c', text: '#000000' }; // Rich Orange
  if (str.startsWith('C')) return { bg: '#fcc419', text: '#000000' }; // Golden
  if (str.startsWith('B')) return { bg: '#2f9e44', text: '#000000' }; // Emerald
  if (str.startsWith('A')) return { bg: '#1c7ed6', text: '#000000' }; // Deep Blue
  if (str.startsWith('P')) return { bg: '#adb5bd', text: '#000000' }; // Pro Silver (since text must be black)
  return { bg: '#adb5bd', text: '#000000' };
};
