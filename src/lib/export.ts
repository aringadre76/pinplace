import { Pin } from '../types';

export const exportToCSV = (pins: Pin[], mapName: string): void => {
  const headers = ['Name', 'Description', 'Latitude', 'Longitude', 'Created At'];
  const csvContent = [
    headers.join(','),
    ...pins.map(pin => [
      `"${pin.name.replace(/"/g, '""')}"`,
      `"${(pin.description || '').replace(/"/g, '""')}"`,
      pin.lat,
      pin.lng,
      pin.createdAt.toDate().toISOString()
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${mapName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_pins.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToKML = (pins: Pin[], mapName: string): void => {
  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${mapName}</name>
    <description>Collaborative map pins exported from pinplace</description>
    ${pins.map(pin => `
    <Placemark>
      <name>${pin.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>
      ${pin.description ? `<description>${pin.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</description>` : ''}
      <Point>
        <coordinates>${pin.lng},${pin.lat},0</coordinates>
      </Point>
    </Placemark>`).join('')}
  </Document>
</kml>`;

  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${mapName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_pins.kml`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
