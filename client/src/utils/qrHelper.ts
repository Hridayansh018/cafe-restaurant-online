/**
 * QR Code generation helper using qrcode library
 */

/**
 * Generates a QR code data URL for the given text using the `qrcode` package.
 * Falls back to a simple placeholder if the library is unavailable.
 */
export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    // Dynamic import — qrcode is an optional dep
    const QRCode = await import('qrcode');
    return await QRCode.toDataURL(text, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    // Fallback: return a placeholder SVG data URL
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280">
      <rect width="280" height="280" fill="#f3f4f6" rx="12"/>
      <text x="140" y="130" font-family="monospace" font-size="12" text-anchor="middle" fill="#6b7280">QR Code</text>
      <text x="140" y="150" font-family="monospace" font-size="9" text-anchor="middle" fill="#9ca3af">Install qrcode package</text>
      <text x="140" y="170" font-family="monospace" font-size="8" text-anchor="middle" fill="#9ca3af">npm i qrcode</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}

/**
 * Builds the full diner URL for a given table ID and QR token.
 * Always uses the current deployment's origin, not localhost hardcoded.
 */
export function buildDinerURL(tableId: string, qrToken: string): string {
  return `${window.location.origin}/menu?table=${encodeURIComponent(tableId)}&token=${encodeURIComponent(qrToken)}`;
}

/**
 * Format a number as Indian Rupees (INR)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format epoch ms as a friendly date+time string
 */
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Format epoch ms as date only
 */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
