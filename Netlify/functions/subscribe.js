export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const params = new URLSearchParams(event.body || '');
    const name = (params.get('name') || '').trim();
    const email = (params.get('email') || '').trim();

    if (!name || name.length < 2) {
      return {
        statusCode: 400,
        body: 'Please enter a valid name.'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: 'Please enter a valid email address.'
      };
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_LIST_ID);
    const pdfUrl = process.env.BREVO_PDF_URL;

    if (!apiKey || !listId) {
      return {
        statusCode: 500,
        body: 'Missing server configuration.'
      };
    }

    // 1) Add/update the contact in Brevo
    const contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email,
        attributes: {
          FNAME: name
        },
        listIds: [listId],
        updateEnabled: true,
        emailBlacklisted: false
      })
    });

    const contactText = await contactResponse.text();

    if (!contactResponse.ok) {
      return {
        statusCode: 500,
        body: `Brevo contact error: ${contactText}`
      };
    }

    // 2) Optional: send the PDF link by transactional email
    if (pdfUrl) {
      const senderName = process.env.BREVO_SENDER_NAME || 'Be Inspired';
      const senderEmail = process.env.BREVO_SENDER_EMAIL;

      if (senderEmail) {
        const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
          },
          body: JSON.stringify({
            sender: {
              name: senderName,
              email: senderEmail
            },
            to: [
              {
                email,
                name
              }
            ],
            subject: 'Your free Heart Reset guide',
            htmlContent: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                  <h2>Your Heart Reset guide is here 💛</h2>
                  <p>Hi ${name},</p>
                  <p>Thank you for signing up.</p>
                  <p>
                    Download your free guide here:
                    <a href="${pdfUrl}">${pdfUrl}</a>
                  </p>
                  <p>You’ll also receive your heart restoration emails.</p>
                </body>
              </html>
            `
          })
        });

        const emailText = await emailResponse.text();

        if (!emailResponse.ok) {
          return {
            statusCode: 500,
            body: `Brevo email error: ${emailText}`
          };
        }
      }
    }

    return {
      statusCode: 200,
      body: 'Success! Check your inbox.'
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message || 'Server error.'
    };
  }
}
