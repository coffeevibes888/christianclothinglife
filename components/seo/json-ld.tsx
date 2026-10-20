import React from 'react';

type JsonLdData = Record<string, unknown>;

/**
 * Renders one or more JSON-LD structured-data blocks. Accepts a single schema
 * object or an array of them. The payload is always generated server-side from
 * our own trusted data, so `dangerouslySetInnerHTML` is appropriate here.
 */
export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  const blocks = Array.isArray(data) ? data : [data];

  return (
    <>
      {blocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}

export default JsonLd;
