import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosClient from './axiosClient';
import FormBuilder from './FormBuilder';
import { fieldsFromApi } from '../lib/formBuilder';
import { localize } from '../lib/localize';
import { getApiErrorMessage } from '../lib/apiError';

export function EditForm() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [loadError, setLoadError] = useState('');

  // GET /admin/forms/{slug}
  useEffect(() => {
    let cancelled = false;
    setInitialValues(null);
    setLoadError('');

    axiosClient.get(`/admin/forms/${slug}`)
      .then((response) => {
        if (cancelled) return;
        const form = response.data.data;
        setInitialValues({
          title: localize(form.title, 'AR'),
          description: localize(form.description, 'AR'),
          isActive: Boolean(form.is_active),
          imageUrl: form.image || null,
          fields: fieldsFromApi(form.fields),
        });
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getApiErrorMessage(error, 'Failed to load the form.'));
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // PUT /admin/forms/{slug} عبر POST + _method لأن الطلب multipart (صورة)
  const handleSubmit = async (payload) => {
    payload.append('_method', 'PUT');
    await axiosClient.post(`/admin/forms/${slug}`, payload);
    navigate('/admin/forms', { state: { flash: 'Form updated successfully.' } });
  };

  if (loadError) {
    return (
      <div className="p-8 min-h-screen bg-[#0d1117] text-center space-y-4" dir="ltr">
        <p role="alert" className="text-red-400 text-sm">{loadError}</p>
        <Link to="/admin/forms" className="text-[#ff7a00] text-sm hover:underline">Back to forms</Link>
      </div>
    );
  }

  if (!initialValues) {
    return <div className="p-8 text-center text-gray-400 min-h-screen bg-[#0d1117] flex items-center justify-center">Loading form...</div>;
  }

  return <FormBuilder key={slug} mode="edit" initialValues={initialValues} onSubmit={handleSubmit} />;
}

export default EditForm;
