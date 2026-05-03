exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const { firstName, email } = JSON.parse(event.body || '{}');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Valid email is required.' })
      };
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_LIST_ID = process.env.BREVO_LIST_ID;

    if (!BREVO_API_KEY || !BREVO_LIST_ID) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Server is not configured correctly.' })
      };
    }

    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName || ''
        },
        listIds: [Number(BREVO_LIST_ID)],
        updateEnabled: true
      })
    });

    const brevoData = await brevoRes.json().catch(() => ({}));

    if (!brevoRes.ok) {
      return {
        statusCode: brevoRes.status,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: brevoData.message || 'Failed to subscribe contact.'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Successfully subscribed.'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Unexpected server error.'
      })
    };
  }
};
