import { localize } from './localize';

// الأنواع التي يقبلها الـ backend فقط (StoreFormRequest / UpdateFormRequest)
export const FIELD_TYPES = ['text', 'textarea', 'email', 'number', 'date', 'select', 'checkbox', 'radio', 'file'];
export const CHOICE_TYPES = ['select', 'radio', 'checkbox'];

let localKeyCounter = 0;
const nextLocalKey = () => `new-${Date.now()}-${++localKeyCounter}`;

// key: مفتاح محلي للواجهة فقط. serverId: رقم الحقل في قاعدة البيانات (للحقول المحفوظة).
// إرسال serverId عند التعديل ضروري: بدونه يحذف الـ backend الحقول القديمة ومعها كل إجابات التسجيلات.
export const createLocalField = (type, label = '') => ({
  key: nextLocalKey(),
  serverId: null,
  type,
  label,
  required: false,
  options: CHOICE_TYPES.includes(type) ? ['Option 1'] : null,
});

export const fieldsFromApi = (apiFields = []) =>
  [...apiFields]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((field) => ({
      key: `field-${field.id}`,
      serverId: field.id,
      type: FIELD_TYPES.includes(field.type) ? field.type : 'text',
      // القيم الأصلية المستخدمة في التحقق والإرسال محفوظة في ar
      label: localize(field.label, 'AR'),
      required: Boolean(field.is_required),
      options: Array.isArray(field.options) ? field.options.map((opt) => localize(opt, 'AR')) : null,
    }));

export const validateFormDraft = ({ title, fields }) => {
  const errors = { fields: {} };

  if (!title.trim()) errors.title = 'Title is required.';
  if (fields.length === 0) errors.general = 'Add at least one field.';

  fields.forEach((field) => {
    if (!field.label.trim()) {
      errors.fields[field.key] = 'Label is required.';
    } else if (CHOICE_TYPES.includes(field.type) && !(field.options || []).some((opt) => opt.trim())) {
      errors.fields[field.key] = 'Add at least one option.';
    }
  });

  const hasErrors = Boolean(errors.title || errors.general || Object.keys(errors.fields).length);
  return hasErrors ? errors : null;
};

// يبني الـ payload بنفس المفاتيح التي يتحقق منها الـ backend. لا نرسل slug:
// الـ backend يولّده عند الإنشاء، وإعادة توليده عند التعديل كانت تغيّر رابط النموذج المنشور.
export const buildFormPayload = ({ title, description, isActive, fields, image, removeImage }) => {
  const payload = new FormData();
  payload.append('title', title.trim());
  payload.append('description', description.trim());
  payload.append('is_active', isActive ? '1' : '0');

  fields.forEach((field, index) => {
    if (field.serverId) payload.append(`fields[${index}][id]`, field.serverId);
    payload.append(`fields[${index}][type]`, field.type);
    payload.append(`fields[${index}][label]`, field.label.trim());
    payload.append(`fields[${index}][is_required]`, field.required ? '1' : '0');
    payload.append(`fields[${index}][order]`, index + 1);

    if (CHOICE_TYPES.includes(field.type)) {
      (field.options || [])
        .map((opt) => opt.trim())
        .filter(Boolean)
        .forEach((opt, optIndex) => payload.append(`fields[${index}][options][${optIndex}]`, opt));
    }
  });

  if (image) {
    payload.append('image', image);
  } else if (removeImage) {
    payload.append('remove_image', '1');
  }

  return payload;
};
