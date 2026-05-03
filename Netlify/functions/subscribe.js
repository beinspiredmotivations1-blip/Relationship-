exports.handler = async (event) => {
  // Allow only POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const { name, email } = JSON.parse(event.body || "{}");

    if (!name || !email) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Name and email are required." }),
      };
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: name
        },
        listIds: [Number(process.env.BREVO_LIST_ID)],
        updateEnabled: true
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: data.message || "Failed to subscribe contact.",
          details: data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Successfully subscribed!",
        data,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Server error.",
        error: error.message,
      }),
    };
  }
};
