import { getDisplayableUsername } from ':core/username/getDisplayableUsername.js';
import { store } from ':store/store.js';
import { useEffect, useRef, useState } from 'preact/hooks';

interface UsernameState {
  isLoading: boolean;
  username: string | null;
}

export function useUsername() {
  const [state, setState] = useState<UsernameState>({
    isLoading: true,
    username: null,
  });

  const addressRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      const currentAddress = store.account.get().accounts?.[0];

      // Skip if address hasn't changed
      if (currentAddress === addressRef.current) {
        return;
      }

      addressRef.current = currentAddress ?? null;

      if (currentAddress) {
        try {
          const username = await getDisplayableUsername(currentAddress);
          setState({ isLoading: false, username });
        } catch (error) {
          console.warn('Failed to fetch username:', error);
          setState({ isLoading: false, username: null });
        }
      } else {
        setState({ isLoading: false, username: null });
      }
    };

    fetchUsername();
  }, []);

  return state;
}
