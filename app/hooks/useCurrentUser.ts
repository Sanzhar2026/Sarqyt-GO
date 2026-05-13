// hooks/useCurrentUser.ts
'use client';

import { useState, useEffect } from 'react';

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/check-auth', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                setUser({
                    id: data.user_id,
                    full_name: data.user_name,
                    phone: data.user_phone
                });
            }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  return { user, loading };
}