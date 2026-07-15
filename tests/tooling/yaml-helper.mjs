// Minimal YAML parser for test assertions only.
// Does not support all YAML features — only what compose.production.yml uses.

export function parse(yaml) {
  const lines = yaml.split('\n');
  const result = {};
  const stack = [{ obj: result, indent: -1 }];

  for (const raw of lines) {
    const line = raw.replace(/\s*$/, '');
    if (line === '' || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const content = line.trim();

    if (content.startsWith('- ')) {
      const value = content.slice(2);
      const parent = stack[stack.length - 1].obj;
      if (!Array.isArray(parent)) {
        throw new Error(`Unexpected array item at line: ${line}`);
      }
      parent.push(parseValue(value));
      continue;
    }

    const colonIdx = content.indexOf(':');
    if (colonIdx === -1) continue;

    const key = content.slice(0, colonIdx).trim();
    const value = content.slice(colonIdx + 1).trim();

    // Pop stack back to correct indent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (value === '') {
      const newObj = {};
      if (Array.isArray(parent)) {
        parent.push(newObj);
      } else {
        parent[key] = newObj;
      }
      stack.push({ obj: newObj, indent });
    } else {
      const parsed = parseValue(value);
      if (key === '-' && Array.isArray(parent)) {
        parent.push(parsed);
      } else {
        parent[key] = parsed;
      }
    }
  }

  return result;
}

function parseValue(value) {
  // Handle boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Handle number
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  // Handle quoted strings
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }

  // Handle YAML flow style { }
  if (value.startsWith('{') && value.endsWith('}')) {
    const inner = value.slice(1, -1);
    const obj = {};
    for (const part of inner.split(',')) {
      const [k, v] = part.split(':').map((s) => s.trim());
      obj[k] = parseValue(v);
    }
    return obj;
  }

  return value;
}
