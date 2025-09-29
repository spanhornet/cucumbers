"use client";

// React
import { useEffect, useState } from "react";

// Next.js
import { useSearchParams, useRouter } from "next/navigation";

// Lucide Icons
import { Loader2 as LoaderIcon } from "lucide-react";

// API Handler
import { apiHandler } from "@/lib/api-handler";

// Types
interface VerifyMagicLinkResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  session: {
    token: string;
    expiresAt: string;
  };
  stytch: {
    user_id: string;
    session_token: string;
    session_jwt: string;
  };
}

export default function VerifyMagicLinkPage() {
  // Set state
  const [isVerifying, setIsVerifying] = useState(true);

  // Set search parameters
  const searchParameters = useSearchParams();

  // Set router
  const router = useRouter();

  useEffect(() => {
    const verifyMagicLink = async () => {
      try {
        // Get the token
        const token = searchParameters.get('token');

        if (!token) {
          console.error('No token found in URL');
          router.push('/sign-in');
          return;
        }

        // Verify magic link
        const response = await apiHandler.post<VerifyMagicLinkResponse>('/api/users/verify-magic-link', {
          token: token
        });

        if (response.error) {
          console.error('Magic link verification failed:', response.error);
          router.push('/sign-in');
          return;
        }

        if (response.data && response.data.success) {
          // Store session data
          const sessionData = {
            token: response.data.session.token,
            expiresAt: response.data.session.expiresAt,
            user: response.data.user,
            stytch: response.data.stytch
          };

          localStorage.setItem('session', JSON.stringify(sessionData));

          // Redirect
          router.push('/');
        } else {
          console.error('Invalid response from verify magic link');
          router.push('/sign-in');
        }
      } catch (error) {
        console.error('Verify magic link error:', error);
        router.push('/sign-in');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyMagicLink();
  }, [searchParameters, router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <LoaderIcon className="h-8 w-8 animate-spin" />
    </div>
  );
}
