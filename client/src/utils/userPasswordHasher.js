import bcrypt from "bcryptjs";
 
export const hashUserPasswords = async (users, onProgress, saltRounds = 10, shouldCancel = () => false) => {
    const totalUsers = users.length;
    const hashedUsers = [];
    
    if (totalUsers === 0) {
        return users;
    }

    for (let i = 0; i < totalUsers; i++) {
        // Check for cancellation before processing each user
        if (shouldCancel()) {
            throw new Error('Process cancelled by user');
        }
        
        const user = users[i];
        
        try {
            // Create a copy of the user to avoid mutating the original
            const userCopy = { ...user };
            
            // Hash the password field if it exists
            if (user.password && typeof user.password === 'string') {
                userCopy.password = await bcrypt.hash(user.password, saltRounds);
            } else {
                throw new Error(`Password is required for user: ${user.name || 'Unknown'}`);
            }
            
            hashedUsers.push(userCopy);
            
            // Calculate and report progress
            const progress = Math.round(((i + 1) / totalUsers) * 100);
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: totalUsers,
                    percentage: progress,
                    currentUser: user.name || `User ${i + 1}`
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
            
            console.error(`Error hashing password for user ${user.name || i}:`, error);
            // Don't add users with password hashing errors
            throw new Error(`Failed to hash password for user: ${user.name || 'Unknown'} - ${error.message}`);
        }
    }
    
    return hashedUsers;
};