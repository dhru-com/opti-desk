import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth';
import { data } from './data';
import { storage } from './storage';
import { pdfGenerator } from './functions/pdf-generator/resource';

defineBackend({
  auth,
  data,
  storage,
  pdfGenerator,
});
