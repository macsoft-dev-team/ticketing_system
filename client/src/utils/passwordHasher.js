import bcrypt from "bcryptjs";
 
export const hashDevicePasswords = async (devices, onProgress, saltRounds = 10, shouldCancel = () => false) => {
    const totalDevices = devices.length;
    const hashedDevices = [];
    
    if (totalDevices === 0) {
        return devices;
    }

    for (let i = 0; i < totalDevices; i++) {
        // Check for cancellation before processing each device
        if (shouldCancel()) {
            throw new Error('Process cancelled by user');
        }
        
        const device = devices[i];
        
        try {
            // Create a copy of the device to avoid mutating the original
            const deviceCopy = { ...device };
            
            // Hash the password field if it exists
            if (device.password && typeof device.password === 'string') {
                deviceCopy.hashedPassword = await bcrypt.hash(device.password, saltRounds);
                // Optionally remove the original password for security
                delete deviceCopy.password;
            } else if (device.imeinumber) {
                // If no password field, use IMEI as password (as per existing logic)
                deviceCopy.hashedPassword = await bcrypt.hash(device.imeinumber.toString(), saltRounds);
            }
            
            hashedDevices.push(deviceCopy);
            
            // Calculate and report progress
            const progress = Math.round(((i + 1) / totalDevices) * 100);
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: totalDevices,
                    percentage: progress,
                    currentDevice: device.imeinumber || `Device ${i + 1}`
                });
            }
            
            // Add a small delay to prevent UI blocking and allow cancellation checks
            if (i % 5 === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
                // Check for cancellation after delay
                if (shouldCancel()) {
                    throw new Error('Process cancelled by user');
                }
            }
            
        } catch (error) {
            // If it's a cancellation error, re-throw it
            if (error.message === 'Process cancelled by user') {
                throw error;
            }
            
            console.error(`Error hashing password for device ${device.imeinumber || i}:`, error);
            // Still add the device but without hashed password
            hashedDevices.push({ ...device, hashError: error.message });
            
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: totalDevices,
                    percentage: Math.round(((i + 1) / totalDevices) * 100),
                    currentDevice: device.imeinumber || `Device ${i + 1}`,
                    error: error.message
                });
            }
        }
    }
    
    return hashedDevices;
};

 