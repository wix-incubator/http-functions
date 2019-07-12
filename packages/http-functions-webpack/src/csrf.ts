function getCookie(name) {
  if (typeof document !== 'undefined') {
    const parts = `; ${document.cookie}`.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts
        .pop()
        .split(';')
        .shift();
    }
  }
}

export const getCSRFToken = () => getCookie('XSRF-TOKEN');
