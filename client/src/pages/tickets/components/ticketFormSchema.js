import * as yup from 'yup';

// Simplified validation schema for debugging
export const ticketFormSchema = yup.object({
  // ticketCode is now auto-generated, so no validation needed
  customerName: yup.string().required('Customer name is required'),
  farmerName: yup.string().required('Farmer name is required'),
  controllerNo: yup.string().required('Controller number is required'),
  imei: yup.string().nullable(),
  hp: yup.string().nullable(),
  motorHpId: yup.number().nullable(),
  motorType: yup.string().nullable(),
  head: yup.string().nullable(),
  pumpPlacementDepth: yup.string().nullable(),
  cableLength: yup.string().nullable(),
  district: yup.string().nullable(),
  block: yup.string().nullable(),
  village: yup.string().nullable(),
  faultType: yup.string().required('Fault type is required'),
  faultCode: yup.string().when('faultType', {
    is: 'Motor Not Running',
    then: (schema) => schema.required('Fault code is required for Motor Not Running'),
    otherwise: (schema) => schema.nullable()
  }),
  description: yup.string().required('Description is required'),
  priority: yup.string().required('Priority is required'),
  category: yup.string().required('Category is required'),
  state: yup.string().required('State is required'),
  attachments: yup.mixed().nullable()
});

// Default values for the form
export const defaultValues = {
  // ticketCode is auto-generated, so no default value needed
  customerName: '',
  farmerName: '',
  controllerNo: '',
  imei: '',
  hp: '',
  motorHpId: null,
  motorType: '',
  head: '',
  pumpPlacementDepth: '',
  cableLength: '',
  district: '',
  block: '',
  village: '',
  faultType: '',
  faultCode: '',
  description: '',
  priority: 'medium',
  category: 'hardware',
  state: '',
  attachments: null
};

// Fault type options
export const faultTypeOptions = [
  { value: 'Motor Not Running', label: 'Motor Not Running' },
  { value: 'Low Water Discharge', label: 'Low Water Discharge' },
  { value: 'External System Damage', label: 'External System Damage' },
  { value: 'Controller Not ON', label: 'Controller Not ON' },
  { value: 'Others', label: 'Others' }
];

// Priority options
export const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
];

// Category options
export const categoryOptions = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'installation', label: 'Installation' },
  { value: 'troubleshooting', label: 'Troubleshooting' }
];