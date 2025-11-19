// Indian states and union territories data (matching database state codes)
export const INDIAN_STATES = [
  { label: 'Andhra Pradesh', value: '28' },
  { label: 'Arunachal Pradesh', value: '12' },
  { label: 'Assam', value: '18' },
  { label: 'Bihar', value: '10' },
  { label: 'Chhattisgarh', value: '22' },
  { label: 'Goa', value: '30' },
  { label: 'Gujarat', value: '24' },
  { label: 'Haryana', value: '6' },
  { label: 'Himachal Pradesh', value: '2' },
  { label: 'Jharkhand', value: '20' },
  { label: 'Karnataka', value: '29' },
  { label: 'Kerala', value: '32' },
  { label: 'Madhya Pradesh', value: '23' },
  { label: 'Maharashtra', value: '27' },
  { label: 'Manipur', value: '14' },
  { label: 'Meghalaya', value: '17' },
  { label: 'Mizoram', value: '15' },
  { label: 'Nagaland', value: '13' },
  { label: 'Odisha', value: '21' },
  { label: 'Punjab', value: '3' },
  { label: 'Rajasthan', value: '8' },
  { label: 'Sikkim', value: '11' },
  { label: 'Tamil Nadu', value: '33' },
  { label: 'Telangana', value: '36' },
  { label: 'Tripura', value: '16' },
  { label: 'Uttar Pradesh', value: '9' },
  { label: 'Uttarakhand', value: '5' },
  { label: 'West Bengal', value: '19' },
  // Union Territories
  { label: 'Andaman and Nicobar Islands', value: '35' },
  { label: 'Chandigarh', value: '4' },
  { label: 'The Dadra And Nagar Haveli And Daman And Diu', value: '38' },
  { label: 'Delhi', value: '7' },
  { label: 'Jammu And Kashmir', value: '1' },
  { label: 'Ladakh', value: '37' },
  { label: 'Lakshadweep', value: '31' },
  { label: 'Puducherry', value: '34' }
];

// Export sorted by label for better UX
export const SORTED_INDIAN_STATES = [...INDIAN_STATES].sort((a, b) => a.label.localeCompare(b.label));