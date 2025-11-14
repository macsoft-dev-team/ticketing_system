import * as XLSX from 'xlsx';

// Function to validate if any cell contains scientific notation (E notation)
export const validateForScientificNotation = (data) => {
  const scientificNotationPattern = /\d+\.?\d*[eE][+-]?\d+/;
  const errors = [];
  
  data.forEach((row, rowIndex) => {
    Object.entries(row).forEach(([column, value]) => {
      if (value && typeof value === 'string' && scientificNotationPattern.test(value)) {
        errors.push({
          row: rowIndex + 2, // +2 because we start from row 2 (1 is header)
          column: column,
          value: value,
          message: `Scientific notation detected: ${value}`
        });
      }
    });
  });
  
  return errors;
};

export const readExcelAsJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);

 
        // Validate for scientific notation
        const validationErrors = validateForScientificNotation(json);
        if (validationErrors.length > 0) {
          const errorMessage = `Scientific notation detected in Excel file:\n${validationErrors.map(err => 
            `Row ${err.row}, Column "${err.column}": ${err.value}`
          ).join('\n')}\n\nPlease format these cells as text or numbers without scientific notation.`;
          
          reject(new Error(errorMessage));
          return;
        }

        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
