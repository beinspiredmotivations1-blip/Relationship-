exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const params = new URLSearchParams(event.body);

    const name = (params.get('name') || '').trim();
    const email = (params.get('email') || '').trim();

    if (!name || name.length < 2) {
      return { statusCode: 400, body: 'Please enter a valid name.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { statusCode: 400, body: 'Please enter a valid email.' };
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = parseInt(process.env.BREVO_LIST_ID, 10);

    if (!apiKey || !listId) {
      return { statusCode: 500, body: 'Server config error.' };
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FNAME: name
        },
        listIds: [listId],
        updateEnabled: true
      })
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: text
      };
    }

    return {
      statusCode: 200,
      body: 'Great! Your PDF is sent. Check your email.'
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: error.message
    };
  }
};
