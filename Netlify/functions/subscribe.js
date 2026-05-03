exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Method not allowed'
    };
  }

  try {
    const params = new URLSearchParams(event.body || '');
    const name = (params.get('name') || '').trim();
    const email = (params.get('email') || '').trim();

    if (!name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'Name is required.'
      };
    }

    if (name.length < 2) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'Name must be at least 2 characters.'
      };
    }

    if (!email) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'Email is required.'
      };
    }

    const emailValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);

    if (!emailValid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'Please enter a valid email address.'
      };
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: name
        },
        listIds: [Number(process.env.BREVO_LIST_ID)],
        updateEnabled: true
      })
    });

    const brevoData = await brevoResponse.text();

    if (!brevoResponse.ok) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'Signup failed. Please try again.'
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Success! Check your inbox for your free guide.'
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Server error. Please try again later.'
    };
  }
};
