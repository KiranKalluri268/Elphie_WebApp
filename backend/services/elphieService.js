import axios from 'axios';

const ELPHIE_LAMBDA_URL = process.env.ELPHIE_LAMBDA_URL || 'https://k6eautcco2.execute-api.ap-south-1.amazonaws.com/default/DentalAppAuth';

/**
 * Register a doctor in Elphie backend (Lambda/DynamoDB)
 * @param {string} username - Username for Elphie (can be email or generated username)
 * @param {string} password - Password for Elphie account
 * @returns {Promise<{success: boolean, doctorID?: string, error?: string}>}
 */
export const registerDoctorInElphie = async (username, password) => {
  try {
    const response = await axios.post(ELPHIE_LAMBDA_URL, {
      action: 'register',
      username: username.trim(),
      password: password
    });

    if (response.data.statusCode === 200) {
      const body = typeof response.data.body === 'string' 
        ? JSON.parse(response.data.body) 
        : response.data.body;
      
      if (body.DoctorID) {
        return {
          success: true,
          doctorID: body.DoctorID
        };
      }
      return {
        success: false,
        error: 'DoctorID not returned from Elphie'
      };
    } else {
      const body = typeof response.data.body === 'string' 
        ? JSON.parse(response.data.body) 
        : response.data.body;
      
      return {
        success: false,
        error: body.error || 'Registration failed in Elphie'
      };
    }
  } catch (error) {
    console.error('Elphie doctor registration error:', error);
    
    // Handle different error formats
    let errorMessage = 'Failed to register doctor in Elphie backend';
    if (error.response && error.response.data) {
      try {
        const body = typeof error.response.data.body === 'string'
          ? JSON.parse(error.response.data.body)
          : error.response.data.body || error.response.data;
        errorMessage = body?.error || error.response.data?.error || errorMessage;
      } catch (parseError) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Create a patient in Elphie backend (Lambda/DynamoDB)
 * Based on Lambda code, patient creation uses POST /patients with name and phoneNumber
 * The Lambda checks for '/patients' in the path or uses action parameter
 * @param {string} name - Patient name
 * @param {string} phoneNumber - Patient phone number
 * @returns {Promise<{success: boolean, patientID?: string, error?: string}>}
 */
export const createPatientInElphie = async (name, phoneNumber) => {
  try {
    // Try constructing /patients endpoint URL
    // If ELPHIE_LAMBDA_URL is like: https://xxx.execute-api.region.amazonaws.com/stage/resource
    // We'll try: https://xxx.execute-api.region.amazonaws.com/stage/patients
    let response;
    let responseData;
    
    // Try method 1: Construct /patients endpoint
    try {
      const urlObj = new URL(ELPHIE_LAMBDA_URL);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      // Remove last part (resource name) and add 'patients'
      pathParts.pop();
      pathParts.push('patients');
      urlObj.pathname = '/' + pathParts.join('/');
      const patientsUrl = urlObj.toString();
      
      response = await axios.post(patientsUrl, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim()
      });
      
      // Handle response
      if (response.data.statusCode !== undefined) {
        responseData = typeof response.data.body === 'string' 
          ? JSON.parse(response.data.body) 
          : response.data.body;
      } else {
        responseData = response.data;
      }
      
      if ((response.status === 200 || response.data?.statusCode === 200) && responseData.PatientID) {
        return {
          success: true,
          patientID: responseData.PatientID
        };
      }
    } catch (urlError) {
      console.log('Method 1 (URL construction) failed, trying alternative...');
    }
    
    // Try method 2: Use action parameter with main endpoint (fallback if Lambda supports it)
    try {
      response = await axios.post(ELPHIE_LAMBDA_URL, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Handle response
      if (response.data.statusCode !== undefined) {
        responseData = typeof response.data.body === 'string' 
          ? JSON.parse(response.data.body) 
          : response.data.body;
      } else {
        responseData = response.data;
      }
      
      if ((response.status === 200 || response.data?.statusCode === 200) && responseData.PatientID) {
        return {
          success: true,
          patientID: responseData.PatientID
        };
      }
    } catch (actionError) {
      console.log('Method 2 (action parameter) failed');
    }

    // If both methods failed
    return {
      success: false,
      error: responseData?.error || 'PatientID not returned from Elphie. Please ensure API Gateway has /patients route configured.'
    };
  } catch (error) {
    console.error('Elphie patient creation error:', error);
    
    let errorMessage = 'Failed to create patient in Elphie backend';
    if (error.response && error.response.data) {
      try {
        const body = typeof error.response.data.body === 'string'
          ? JSON.parse(error.response.data.body)
          : error.response.data.body || error.response.data;
        errorMessage = body?.error || error.response.data?.error || errorMessage;
      } catch (parseError) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
