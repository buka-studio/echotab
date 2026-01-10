export function getPublicListURL(publicId: string) {
  return `${import.meta.env.VITE_PUBLIC_WEB_HOST}/lists/${publicId}`;
}

export function getApiURL(path: string) {
  return import.meta.env.VITE_PUBLIC_API_HOST + path;
}
