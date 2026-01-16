import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { pdfGenerator } from './functions/pdf-generator/resource';

defineBackend({
  auth,
  data,
  storage,
  pdfGenerator,
});
