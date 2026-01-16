'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator.Provider>
      <Authenticator>
        {({ signOut, user }) => (
          <main>
            {children}
          </main>
        )}
      </Authenticator>
    </Authenticator.Provider>
  );
}
