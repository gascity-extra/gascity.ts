#!/usr/bin/env bun
/**
 * Generate OpenAPI client from specification
 */

import { $ } from 'bun';

const OPENAPI_URL = 'https://raw.githubusercontent.com/gastownhall/gascity/main/docs/reference/schema/openapi.json';
const OPENAPI_FILE = 'openapi.json';

try {
  console.log('📥 Downloading OpenAPI specification...');
  await $`curl --fail --location --show-error -o ${OPENAPI_FILE} ${OPENAPI_URL}`;
  console.log('✅ OpenAPI specification downloaded');

  console.log('🔨 Generating OpenAPI client...');
  await $`bunx openapi-typescript-codegen --input ${OPENAPI_FILE} --output src/generated --client axios`;
  console.log('✅ OpenAPI client generated successfully');
} catch (error) {
  console.error('❌ Failed to generate OpenAPI client:', error);
  process.exit(1);
}
