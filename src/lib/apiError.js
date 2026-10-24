// تحويل أخطاء Laravel (رسالة عامة + errors لكل حقل) إلى رسائل قابلة للعرض
export const getValidationErrors = (error) => {
  const errors = error?.response?.data?.errors;
  return errors && typeof errors === 'object' ? errors : {};
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error?.response) {
    return error?.request ? 'Could not reach the server. Check your connection and try again.' : fallback;
  }

  const { status, data } = error.response;

  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';

  const fieldMessages = Object.values(getValidationErrors(error)).flat().filter(Boolean);
  if (fieldMessages.length > 0) return [...new Set(fieldMessages)].join(' ');

  if (typeof data?.message === 'string' && data.message) return data.message;

  return fallback;
};
