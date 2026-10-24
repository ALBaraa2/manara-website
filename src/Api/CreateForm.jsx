import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from './axiosClient';
import FormBuilder from './FormBuilder';
import { createLocalField } from '../lib/formBuilder';

const buildDefaultFields = () => {
  const university = createLocalField('select', 'University');
  university.required = true;
  university.options = ['UCAS', 'Al-Aqsa University', 'Islamic University of Gaza', 'Palestine University', 'Other'];

  return [
    { ...createLocalField('text', 'Full name'), required: true },
    { ...createLocalField('email', 'Email address'), required: true },
    { ...createLocalField('text', 'Phone number'), required: true },
    university,
  ];
};

const CreateForm = () => {
  const navigate = useNavigate();
  const [initialValues] = useState(() => ({
    title: '',
    description: '',
    isActive: false,
    imageUrl: null,
    fields: buildDefaultFields(),
  }));

  // POST /admin/forms — الـ backend يولّد الـ slug من العنوان
  const handleSubmit = async (payload, publish) => {
    await axiosClient.post('/admin/forms', payload);
    navigate('/admin/forms', {
      state: { flash: publish ? 'Form published successfully.' : 'Form saved as draft.' },
    });
  };

  return <FormBuilder mode="create" initialValues={initialValues} onSubmit={handleSubmit} />;
};

export default CreateForm;
