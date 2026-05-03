export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);

    const name = (params.get('name') || '').trim();
    const email = (params.get('email') || '').trim();

    console.log('Signup hit', {
      hasName: !!name,
      hasEmail: !!email
    });

    if (!name || name.length < 2) {
      return new Response('Please enter a valid name.', { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response('Please enter a valid email address.', { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listIdRaw = process.env.BREVO_LIST_ID;

    console.log('Env check', {
      hasApiKey: !!apiKey,
      listIdRaw
    });

    if (!apiKey) {
      return new Response('Server error: BREVO_API_KEY is missing.', { status: 500 });
    }

    if (!listIdRaw) {
      return new Response('Server error: BREVO_LIST_ID is missing.', { status: 500 });
    }

    const listId = Number(listIdRaw);

    if (Number.isNaN(listId)) {
      return new Response('Server error: BREVO_LIST_ID must be a number.', { status: 500 });
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true
      })
    });

    const brevoText = await brevoResponse.text();

    console.log('Brevo response', {
      status: brevoResponse.status,
      body: brevoText
    });

    if (!brevoResponse.ok) {
  console.error('Brevo FULL error:', brevoText);
  return new Response(brevoText || 'Brevo failed', { status: brevoResponse.status });
}

    return new Response('Success! Check your inbox.', { status: 200 });
  } catch (error) {
    console.error('Function crashed:', error);
    return new Response(`Server crash: ${error.message}`, { status: 500 });
  }
};

