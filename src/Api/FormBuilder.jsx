import React, { useState } from 'react';
import {
  FiType, FiFileText, FiMail, FiHash,
  FiCalendar, FiChevronDown, FiCheckSquare, FiRadio, FiUpload,
  FiTrash2, FiArrowUp, FiArrowDown, FiCheck, FiImage, FiX, FiSave
} from 'react-icons/fi';
import { CHOICE_TYPES, buildFormPayload, createLocalField, validateFormDraft } from '../lib/formBuilder';
import { getApiErrorMessage } from '../lib/apiError';
import useObjectUrl from '../hooks/useObjectUrl';

const fieldTypes = [
  { type: 'text', label: 'Text', icon: FiType },
  { type: 'textarea', label: 'Textarea', icon: FiFileText },
  { type: 'email', label: 'Email', icon: FiMail },
  { type: 'number', label: 'Number', icon: FiHash },
  { type: 'date', label: 'Date', icon: FiCalendar },
  { type: 'select', label: 'Dropdown', icon: FiChevronDown },
  { type: 'checkbox', label: 'Checkbox', icon: FiCheckSquare },
  { type: 'radio', label: 'Radio', icon: FiRadio },
  { type: 'file', label: 'File Upload (PDF)', icon: FiUpload },
];

const inputClass = 'w-full bg-[#0d1117] border border-gray-800 rounded-xl p-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]';

// محرر النماذج المشترك بين صفحتي الإنشاء والتعديل
const FormBuilder = ({ mode, initialValues, onSubmit }) => {
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [fields, setFields] = useState(initialValues.fields);
  const [selectedKey, setSelectedKey] = useState(initialValues.fields[0]?.key || null);

  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const imageObjectUrl = useObjectUrl(image);
  const imagePreview = imageObjectUrl || (removeImage ? null : initialValues.imageUrl);

  const [submittingAction, setSubmittingAction] = useState(null);
  const [errors, setErrors] = useState(null);
  const [serverError, setServerError] = useState('');

  const selectedField = fields.find((f) => f.key === selectedKey);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setRemoveImage(false);
    }
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImage(null);
    setRemoveImage(Boolean(initialValues.imageUrl));
  };

  const addField = (typeObj) => {
    const newField = createLocalField(typeObj.type, typeObj.label);
    setFields((prev) => [...prev, newField]);
    setSelectedKey(newField.key);
  };

  const removeField = (field, e) => {
    e.stopPropagation();
    if (
      field.serverId &&
      !window.confirm('Removing a saved field also permanently deletes its answers in existing submissions once you save. Continue?')
    ) {
      return;
    }
    const updated = fields.filter((f) => f.key !== field.key);
    setFields(updated);
    if (selectedKey === field.key) setSelectedKey(updated[0]?.key || null);
  };

  const moveField = (index, direction, e) => {
    e.stopPropagation();
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFields(updated);
  };

  const updateSelectedField = (key, value) => {
    setFields((prev) => prev.map((f) => (f.key === selectedKey ? { ...f, [key]: value } : f)));
  };

  const handleSubmit = async (publish) => {
    setServerError('');
    const validationErrors = validateFormDraft({ title, fields });
    setErrors(validationErrors);
    if (validationErrors) {
      const firstInvalid = fields.find((f) => validationErrors.fields[f.key]);
      if (firstInvalid) setSelectedKey(firstInvalid.key);
      return;
    }

    setSubmittingAction(publish ? 'publish' : 'draft');
    try {
      await onSubmit(buildFormPayload({ title, description, isActive: publish, fields, image, removeImage }), publish);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Failed to save the form.'));
      setSubmittingAction(null);
    }
  };

  const busy = submittingAction !== null;
  const statusLabel = initialValues.isActive ? 'Published' : 'Draft';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#0d1117] text-gray-100" dir="ltr">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-gray-800 pb-4">
        <div>
          <span className="text-xs text-gray-400">Admin / Forms {isEdit ? '/ Edit' : '/ Create'}</span>
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Form' : 'Create Form'}</h1>
        </div>
        {isEdit && (
          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${initialValues.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            Current status: {statusLabel}
          </span>
        )}
      </div>

      {(serverError || errors?.general || errors?.title || (errors && Object.keys(errors.fields).length > 0)) && (
        <div role="alert" className="p-4 mb-4 rounded-xl text-sm border bg-red-500/10 text-red-400 border-red-500/25">
          {serverError || errors.general || errors.title || 'Some fields need attention — check the highlighted fields below.'}
        </div>
      )}

      {/* معاينة النموذج */}
      <div className="bg-[#161b22] rounded-2xl border border-gray-800 mb-8 overflow-hidden shadow-sm">
        <div className="w-full h-32 bg-[#0d1117] border-b border-gray-800 relative flex items-center justify-center overflow-hidden">
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Form cover" className="w-full h-full object-cover" />
              <button type="button" onClick={handleRemoveImage} aria-label="Remove header image" className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-600 transition cursor-pointer">
                <FiX size={14} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-500 text-xs gap-1">
              <FiImage size={20} />
              <span>Header Image (Optional)</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white" dir="auto">{title || 'Untitled form'}</h2>
            {description && <p className="text-xs text-gray-400 mt-1 whitespace-pre-line" dir="auto">{description}</p>}
          </div>

          <div className="mt-6 space-y-4 pt-4 border-t border-gray-800/60">
            <h3 className="text-xs font-bold text-[#ff7a00] uppercase tracking-wider">
              Form Fields ({fields.length})
            </h3>

            {fields.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-3">No fields added yet.</p>
            ) : (
              fields.map((field) => (
                <div key={field.key} className="space-y-1.5" dir="auto">
                  <label className="block text-xs font-medium text-gray-300">
                    {field.label || 'Untitled field'} {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select disabled className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-2.5 text-sm text-gray-400">
                      <option>Choose…</option>
                      {field.options?.map((opt, i) => <option key={i}>{opt}</option>)}
                    </select>
                  ) : field.type === 'checkbox' || field.type === 'radio' ? (
                    <div className="space-y-2 pt-1">
                      {field.options?.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                          <input type={field.type} disabled className="w-4 h-4" />
                          <span>{opt || `Option ${i + 1}`}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea disabled rows="3" className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-2.5 text-sm text-gray-500 cursor-not-allowed" />
                  ) : (
                    <input type={field.type} disabled accept={field.type === 'file' ? '.pdf' : undefined} className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-2.5 text-sm text-gray-500 cursor-not-allowed" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* إعدادات النموذج الأساسية */}
          <div className="bg-[#161b22] p-4 rounded-2xl border border-gray-800 grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="form-title" className="block text-xs font-semibold text-gray-400 uppercase mb-1">Title *</label>
              <input
                id="form-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Form title..."
                dir="auto"
                aria-invalid={Boolean(errors?.title)}
                className={`${inputClass} ${errors?.title ? 'border-red-500' : ''}`}
              />
            </div>

            <div>
              <label htmlFor="form-description" className="block text-xs font-semibold text-gray-400 uppercase mb-1">Description</label>
              <textarea
                id="form-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Form description..."
                rows="2"
                dir="auto"
                className={inputClass}
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase mb-1">Header Image</span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex-1 min-w-48 flex items-center justify-center gap-2 p-3 bg-[#0d1117] border border-gray-800 border-dashed rounded-xl cursor-pointer hover:border-[#ff7a00] focus-within:border-[#ff7a00] transition text-xs text-gray-400">
                  <FiUpload size={16} />
                  <span>{image ? image.name : imagePreview ? 'Replace header image...' : 'Choose header image (max 2 MB)...'}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                </label>
                {imagePreview && (
                  <button type="button" onClick={handleRemoveImage} className="px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition cursor-pointer">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* أزرار إضافة الحقول */}
          <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-4">Add Field</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {fieldTypes.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addField(item)}
                    className="flex flex-col items-center justify-center p-3 border border-gray-800 rounded-xl bg-[#0d1117] hover:border-[#ff7a00] hover:bg-[#ff7a00]/10 transition group cursor-pointer"
                  >
                    <IconComponent className="text-gray-400 group-hover:text-[#ff7a00] mb-2 text-lg" />
                    <span className="text-xs font-medium text-gray-300 text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* إدارة الحقول */}
          <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-4">
              Form Fields ({fields.length})
            </h2>

            {fields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No fields added yet. Click an option above to add one.</p>
            ) : (
              <div className="space-y-3">
                {fields.map((f, index) => {
                  const fieldError = errors?.fields[f.key];
                  return (
                    <div
                      key={f.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedKey(f.key)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && setSelectedKey(f.key)}
                      className={`flex items-center justify-between gap-2 p-3.5 rounded-xl border cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-[#ff7a00] ${fieldError ? 'border-red-500 bg-red-500/5' : selectedKey === f.key ? 'border-[#ff7a00] bg-[#ff7a00]/15 ring-1 ring-[#ff7a00]' : 'border-gray-800 bg-[#0d1117] hover:bg-gray-800/50'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-semibold px-2 py-1 bg-[#ff7a00]/20 text-[#ff7a00] rounded uppercase shrink-0">{f.type}</span>
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-gray-200 truncate" dir="auto">{f.label || 'Untitled field'}</span>
                          {fieldError && <span className="block text-xs text-red-400">{fieldError}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" aria-label="Move field up" disabled={index === 0} onClick={(e) => moveField(index, 'up', e)} className="p-1.5 text-gray-500 hover:text-gray-300 rounded disabled:opacity-30"><FiArrowUp size={14} /></button>
                        <button type="button" aria-label="Move field down" disabled={index === fields.length - 1} onClick={(e) => moveField(index, 'down', e)} className="p-1.5 text-gray-500 hover:text-gray-300 rounded disabled:opacity-30"><FiArrowDown size={14} /></button>
                        <button type="button" aria-label="Remove field" onClick={(e) => removeField(f, e)} className="p-1.5 text-red-400 hover:text-red-300 rounded"><FiTrash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* إعدادات الحقل المحدد */}
        <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 h-fit space-y-4 lg:sticky lg:top-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Field Settings</h2>

          {!selectedField ? (
            <p className="text-xs text-gray-500">Select a field to edit its settings.</p>
          ) : (
            <>
              <span className="inline-block px-2 py-1 bg-[#ff7a00]/20 text-[#ff7a00] rounded text-xs font-medium uppercase">
                {selectedField.type}
              </span>

              <div>
                <label htmlFor="field-label" className="block text-xs font-semibold text-gray-400 mb-1">Label *</label>
                <input
                  id="field-label"
                  type="text"
                  value={selectedField.label}
                  onChange={(e) => updateSelectedField('label', e.target.value)}
                  dir="auto"
                  className={inputClass}
                />
              </div>

              {selectedField.type === 'file' && (
                <p className="text-xs text-gray-500">Applicants can upload one PDF file, up to 5 MB.</p>
              )}

              {CHOICE_TYPES.includes(selectedField.type) && (
                <div className="space-y-2 pt-3 border-t border-gray-800">
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Options</span>
                  {selectedField.options?.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        aria-label={`Option ${optIndex + 1}`}
                        placeholder={`Option ${optIndex + 1}`}
                        dir="auto"
                        onChange={(e) => {
                          const updatedOptions = [...selectedField.options];
                          updatedOptions[optIndex] = e.target.value;
                          updateSelectedField('options', updatedOptions);
                        }}
                        className={`${inputClass} text-xs`}
                      />
                      <button
                        type="button"
                        aria-label={`Remove option ${optIndex + 1}`}
                        onClick={() => updateSelectedField('options', selectedField.options.filter((_, i) => i !== optIndex))}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 cursor-pointer"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateSelectedField('options', [...(selectedField.options || []), ''])}
                    className="text-xs text-[#ff7a00] hover:underline mt-1 block font-medium cursor-pointer"
                  >
                    + Add Option
                  </button>
                  {isEdit && selectedField.serverId && (
                    <p className="text-[11px] text-gray-500">Changing option text affects how existing answers match these options.</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span id="field-required-label" className="text-xs font-semibold text-gray-400">Required field</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    aria-labelledby="field-required-label"
                    checked={selectedField.required}
                    onChange={(e) => updateSelectedField('required', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-800 rounded-full peer peer-focus-visible:ring-2 peer-focus-visible:ring-[#ff7a00] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff7a00]"></div>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end items-center gap-3 mt-8 pt-4 border-t border-gray-800">
        <button type="button" onClick={() => handleSubmit(false)} disabled={busy} className="px-5 py-2.5 bg-[#161b22] border border-gray-800 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-800 transition cursor-pointer disabled:opacity-50 flex items-center gap-2">
          <FiSave />
          <span>{submittingAction === 'draft' ? 'Saving...' : 'Save as Draft'}</span>
        </button>
        <button type="button" onClick={() => handleSubmit(true)} disabled={busy} className="px-5 py-2.5 bg-[#ff7a00] text-white rounded-xl text-sm font-semibold hover:bg-[#e06c00] transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
          <FiCheck />
          <span>{submittingAction === 'publish' ? 'Publishing...' : isEdit ? 'Save & Publish' : 'Publish Form'}</span>
        </button>
      </div>
    </div>
  );
};

export default FormBuilder;
