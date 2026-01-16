import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    "custom:workspace_id": {
      dataType: "String",
      mutable: true,
    },
    "custom:role": {
      dataType: "String",
      mutable: true,
    },
  },
});
