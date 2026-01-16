import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'clinic-reports',
  access: (allow) => ({
    'reports/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});
