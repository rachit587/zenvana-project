// zenvana-worker/src/index.js

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function handleOptions(request) {
  // Make sure the headers are included in the OPTIONS request
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS preflight requests.
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: 'POST, OPTIONS',
      },
    });
  }
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    try {
      const body = await request.json();
      const model = body.model || '@cf/meta/llama-3-8b-instruct'; // Default model
      const messages = body.messages;
      const stream = body.stream === true;

      if (!messages) {
        return new Response('Missing messages', { status: 400, headers: corsHeaders });
      }

      let aiResponse;
      if (model.startsWith('@cf/llava')) {
        // Vision Model Request
         aiResponse = await env.AI.run(model, {
            prompt: body.prompt,
            image: body.image,
         });
      } else {
        // Text Model Request
         aiResponse = await env.AI.run(model, { messages, stream });
      }


      if (stream) {
        // For streaming requests, return a streamed response
        const headers = { ...corsHeaders, 'Content-Type': 'text/event-stream' };
        return new Response(aiResponse, { headers });
      } else {
        // For regular requests, return a single JSON object
        const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
        return new Response(JSON.stringify(aiResponse), { headers });
      }

    } catch (e) {
      const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
};