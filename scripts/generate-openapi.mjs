import { readFileSync, writeFileSync } from 'node:fs';
const spec = JSON.parse(readFileSync('openapi/teacloud.openapi.json', 'utf8'));
const schemas = spec.components?.schemas ?? {};
const quote = (value) => JSON.stringify(value);
const prop = (name) => /^[A-Za-z_$][\w$]*$/.test(name) ? name : quote(name);
const refName = (ref) => ref.split('/').at(-1);
function schemaType(schema = {}) {
  if (schema.$ref) return refName(schema.$ref);
  if ('const' in schema) return quote(schema.const);
  if (schema.enum) return schema.enum.map(quote).join(' | ') || 'never';
  if (schema.oneOf) return schema.oneOf.map((item) => `(${schemaType(item)})`).join(' | ');
  if (schema.anyOf) return schema.anyOf.map((item) => `(${schemaType(item)})`).join(' | ');
  if (schema.allOf) return schema.allOf.map((item) => `(${schemaType(item)})`).join(' & ');
  if (Array.isArray(schema.type)) return schema.type.map((type) => schemaType({ ...schema, type })).join(' | ');
  if (schema.type === 'string') return schema.format === 'binary' ? 'File' : 'string';
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'array') return `Array<${schemaType(schema.items)}>`;
  if (schema.type === 'object' || schema.properties || schema.additionalProperties) {
    const required = new Set(schema.required ?? []);
    const lines = Object.entries(schema.properties ?? {}).map(([key, value]) => `  ${prop(key)}${required.has(key) ? '' : '?'}: ${schemaType(value)};`);
    if (schema.additionalProperties) lines.push(`  [key: string]: ${typeof schema.additionalProperties === 'object' ? schemaType(schema.additionalProperties) : 'unknown'};`);
    return `{\n${lines.join('\n')}\n}`;
  }
  return 'unknown';
}
const modelLines = ['/* eslint-disable */','/** Generated from openapi/teacloud.openapi.json. Do not edit manually. */',''];
for (const [name, schema] of Object.entries(schemas)) {
  if (schema.description) modelLines.push(`/** ${schema.description.replaceAll('*/','* /')} */`);
  if (schema.type === 'object' && !schema.allOf && !schema.oneOf && !schema.anyOf && !schema.$ref) {
    const required = new Set(schema.required ?? []); modelLines.push(`export interface ${name} {`);
    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      if (value.description) modelLines.push(`  /** ${value.description.replaceAll('*/','* /')} */`);
      modelLines.push(`  ${prop(key)}${required.has(key) ? '' : '?'}: ${schemaType(value)};`);
    }
    if (schema.additionalProperties) modelLines.push(`  [key: string]: ${typeof schema.additionalProperties === 'object' ? schemaType(schema.additionalProperties) : 'unknown'};`);
    modelLines.push('}');
  } else modelLines.push(`export type ${name} = ${schemaType(schema)};`);
  modelLines.push('');
}
writeFileSync('src/api/generated-models.ts', modelLines.join('\n'));
const qualify = (type) => Object.keys(schemas).sort((a,b)=>b.length-a.length).reduce((value,name)=>value.replace(new RegExp(`(?<![\\w.])${name}(?![\\w])`,'g'),`Models.${name}`),type);
const methods = new Set(['get','post','put','patch','delete','options','head']);
const operations = [];
for (const [path, pathItem] of Object.entries(spec.paths ?? {})) for (const [method, operation] of Object.entries(pathItem)) {
  if (!methods.has(method)) continue;
  const id = operation.operationId ?? `${method}_${path}`.replace(/\W+/g,'_');
  const params = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].filter((item)=>!item.$ref);
  const mapParams = (location) => params.filter((item)=>item.in===location).map((item)=>[item.name,Boolean(item.required),schemaType(item.schema)]);
  let bodyType, bodyKind = null; const content = operation.requestBody?.content;
  if (content) {
    if (content['multipart/form-data']) { bodyType='FormData'; bodyKind='multipart'; }
    else if (content['application/x-www-form-urlencoded']) { bodyType='URLSearchParams'; bodyKind='form'; }
    else { bodyType=schemaType(Object.values(content)[0]?.schema); bodyKind='json'; }
  }
  const response = operation.responses?.['200'] ?? operation.responses?.['201'] ?? operation.responses?.default ?? {};
  const responseContent = response.content ? Object.values(response.content)[0] : undefined;
  const responseSchema = responseContent?.schema; const responseKind = !responseContent ? 'void' : responseSchema?.format==='binary' ? 'blob' : 'json';
  const responseType = responseKind==='void' ? 'void' : responseKind==='blob' ? 'Blob' : schemaType(responseSchema);
  operations.push({id,method:method.toUpperCase(),path,pathParams:mapParams('path'),queryParams:mapParams('query'),bodyType,bodyKind,responseKind,responseType});
}
const objectType = (params) => `{\n${params.map(([name,required,type])=>`    ${prop(name)}${required?'':'?'}: ${type};`).join('\n')}\n  }`;
const lines=['/* eslint-disable */','/** Generated operation catalog from OpenAPI. */',"import type * as Models from './generated-models.js';",'','export const operations = {'];
for (const op of operations) lines.push(`  ${quote(op.id)}: { method: ${quote(op.method)}, path: ${quote(op.path)}, bodyKind: ${op.bodyKind?quote(op.bodyKind):'null'}, responseKind: ${quote(op.responseKind)} },`);
lines.push('} as const;','','export type OperationId = keyof typeof operations;','','export interface OperationInputMap {');
for (const op of operations) {
  const sections=[]; if(op.pathParams.length)sections.push(`    path: ${qualify(objectType(op.pathParams))};`);if(op.queryParams.length)sections.push(`    query: ${qualify(objectType(op.queryParams))};`);if(op.bodyType)sections.push(`    body: ${qualify(op.bodyType)};`);
  if(!sections.length)lines.push(`  ${quote(op.id)}: Record<string, never>;`);else lines.push(`  ${quote(op.id)}: {`,...sections,'  };');
}
lines.push('}','','export interface OperationOutputMap {');for(const op of operations)lines.push(`  ${quote(op.id)}: ${qualify(op.responseType)};`);lines.push('}','','export interface OperationMeta {','  method: string;','  path: string;',"  bodyKind: 'json' | 'multipart' | 'form' | null;","  responseKind: 'json' | 'blob' | 'void';",'}','');
writeFileSync('src/api/generated-operations.ts',lines.join('\n'));
console.log(`Generated ${Object.keys(schemas).length} models and ${operations.length} operations.`);
