const { 
  getNextTicketNumber, 
  getTicketStats, 
  updateTicketPrefix, 
  generateTicketCode 
} = require("../lib/ticketCodeGenerator");

/**
 * Get ticket statistics for a specific year
 */
const getTicketStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const stats = await getTicketStats(targetYear);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to get ticket statistics",
      error: error.message 
    });
  }
};

/**
 * Get the next ticket number for preview
 */
const getNextTicketPreview = async (req, res) => {
  try {
    const { prefix, suffix } = req.query;
    const nextNumber = await getNextTicketNumber();
    const currentYear = new Date().getFullYear();
    
    // Generate preview ticket code
    const paddedNumber = String(nextNumber).padStart(3, '0');
    const previewCode = suffix 
      ? `${prefix || 'TKT'}-${currentYear}-${paddedNumber}-${suffix}`
      : `${prefix || 'TKT'}-${currentYear}-${paddedNumber}`;
    
    res.status(200).json({
      nextNumber,
      previewCode,
      year: currentYear,
      prefix: prefix || 'TKT',
      suffix: suffix || ''
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to get ticket preview",
      error: error.message 
    });
  }
};

/**
 * Update ticket code prefix
 */
const updatePrefix = async (req, res) => {
  try {
    const { prefix, year } = req.body;
    
    if (!prefix || prefix.trim() === '') {
      return res.status(400).json({ 
        message: "Prefix is required" 
      });
    }

    const targetYear = year || new Date().getFullYear();
    const updatedSequence = await updateTicketPrefix(prefix.trim(), targetYear);
    
    res.status(200).json({
      message: "Ticket prefix updated successfully",
      sequence: updatedSequence
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to update ticket prefix",
      error: error.message 
    });
  }
};

/**
 * Generate a sample ticket code (for testing purposes)
 */
const generateSampleCode = async (req, res) => {
  try {
    const { prefix, suffix } = req.body;
    
    // This is just for preview - doesn't actually increment the sequence
    const sampleCode = await generateTicketCode(prefix, suffix);
    
    res.status(200).json({
      sampleCode,
      message: "Sample ticket code generated (this incremented the actual sequence)"
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to generate sample code",
      error: error.message 
    });
  }
};

module.exports = {
  getTicketStatistics,
  getNextTicketPreview,
  updatePrefix,
  generateSampleCode
};