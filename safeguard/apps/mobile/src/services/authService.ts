import { UserRole } from '../context/AuthContext';

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  emergencyContact?: string;
  role: UserRole;
}

const simulateDelay = (ms = 1500) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  signup: async (data: SignupData) => {
    await simulateDelay();
    
    // Generate Unique IDs for non-woman roles
    let uniqueId;
    if (data.role === 'child') {
      uniqueId = `CHILD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    } else if (data.role === 'parent') {
      uniqueId = `PARENT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    return {
      success: true,
      user: {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        role: data.role,
        uniqueId
      }
    };
  },

  verifyAadhaar: async (aadhaarNumber: string) => {
    await simulateDelay(2000);
    
    // Mock validation: In this demo, we'll simulate a check that ensures gender is female
    // For demo purposes, any 12 digit number starting with '1' is "male" (error) 
    // and anything else is "female" (success)
    if (aadhaarNumber.startsWith('1')) {
      return { 
        success: false, 
        message: 'Aadhaar verification failed: User gender must be Female for this role.' 
      };
    }

    return { 
      success: true, 
      message: 'Aadhaar verification successful. OTP sent to registered mobile number.' 
    };
  },

  verifyOtp: async (otp: string) => {
    await simulateDelay(1500);
    if (otp === '123456') {
      return { success: true };
    }
    return { success: false, message: 'Invalid OTP. Please try again.' };
  }
};
