export const authService = {
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  getUserId: (): string | null => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No token found');
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        console.log('Found sub in token:', payload.sub);
        return payload.sub;
      }
      if (payload.user_id) {
        console.log('Found user_id in token:', payload.user_id);
        return payload.user_id;
      }
      if (payload.preferred_username) {
        console.log('Found preferred_username in token:', payload.preferred_username);
        return payload.preferred_username;
      }
      console.log('No user identifier found in token');
      return null;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }
};
