import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const testSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email().required('Email is required')
});

export default function FormTest() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(testSchema),
    mode: 'all'
  });

  const onSubmit = (data) => {
    console.log('Form submitted:', data);
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Form Test</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label>Name</label>
          <input {...register('name')} className="border p-2 w-full" />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}
        </div>
        
        <div>
          <label>Email</label>
          <input {...register('email')} className="border p-2 w-full" />
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}
        </div>
        
        <div className="bg-gray-100 p-4">
          <p>Is Valid: {isValid ? 'Yes' : 'No'}</p>
          <p>Errors: {Object.keys(errors).length}</p>
        </div>
        
        <button 
          type="submit" 
          disabled={!isValid}
          className={`px-4 py-2 rounded ${
            isValid 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
      </form>
    </div>
  );
}