export function getPublicListURL(publicId: string) {
  return `${import.meta.env.VITE_PUBLIC_WEB_HOST}/lists/${publicId}`;
}

export function getApiURL(path: string) {
  return 'http://localhost:3001/api' + path;
  // return import.meta.env.VITE_PUBLIC_API_HOST + path;
}
