/** Extrait le nom de fichier d'un en-tête `Content-Disposition` (filename* UTF-8 ou filename). */
export function filenameFromContentDisposition(header: string | null | undefined): string | null {
  if (!header) {
    return null;
  }
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim().replace(/^"|"$/g, ''));
    } catch {
      /* en-tête mal encodé : on retombe sur filename= */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/** Déclenche le téléchargement d'un Blob dans le navigateur. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** « Salle Fit & Co » → « salle-fit-co » (pour un nom de fichier). */
export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'export'
  );
}
