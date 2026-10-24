// قناة بين أي زر في الصفحة ونموذج التواصل: يحدد الزر موضوع الرسالة، ويستقبلها Contact
// فيملأ الموضوع ونصاً مقترحاً. detail: مفتاح موضوع ('support' | 'volunteer' | 'partner' | 'workshop' | 'general')
// أو { topic: 'service', label } لطلب معلومات عن خدمة بعينها.
export const CONTACT_INTENT_EVENT = 'manara:contact-intent';

export const announceIntent = (detail) => window.dispatchEvent(new CustomEvent(CONTACT_INTENT_EVENT, { detail }));
