const API_URL = 'http://YOUR_LOCAL_IP:5000/api';

export const api = {
  registerEmployee: async (employeeData: any) => {
    const response = await fetch(`${API_URL}/employee/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Registration failed');
    return result.data;
  },

  uploadSelfie: async (employeeId: string, photoUri: string) => {
    const formData = new FormData();
    const filename = photoUri.split('/').pop() || 'selfie.jpg';
    
    formData.append('selfie', {
      uri: photoUri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    const response = await fetch(`${API_URL}/employee/${employeeId}/selfie`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Selfie upload failed');
    return result.data;
  },

  uploadDocument: async (employeeId: string, type: string, fileUri: string, mimeType: string) => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'document.pdf';

    formData.append('document', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);
    formData.append('type', type);

    const response = await fetch(`${API_URL}/employee/${employeeId}/document`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Failed to upload ${type}`);
    return result.data;
  }
};