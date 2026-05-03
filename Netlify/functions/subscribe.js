exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed." })
    };
  }

  try {
    const contentType = event.headers["content-type"] || "";
    let body = {};

    if (contentType.includes("application/json")) {
      body = JSON.parse(event.body || "{}");
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = Object.fromEntries(new URLSearchParams(event.body || ""));
    } else {
      body = {};
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Email is required." })
      };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Please enter a valid email address." })
      };
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_LIST_ID);

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: "Missing BREVO_API_KEY." })
      };
    }

    if (!listId || Number.isNaN(listId)) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: "Missing or invalid BREVO_LIST_ID." })
      };
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: name || ""
        },
        listIds: [listId],
        updateEnabled: true
      })
    });

    const rawText = await brevoResponse.text();

    let brevoData = {};
    try {
      brevoData = rawText ? JSON.parse(rawText) : {};
    } catch {
      brevoData = { message: rawText || "Brevo returned an invalid response." };
    }

    if (!brevoResponse.ok) {
      return {
        statusCode: brevoResponse.status,
        headers,
        body: JSON.stringify({
          message: brevoData.message || "Unable to subscribe contact."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Thanks! You’ve been subscribed."
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: error.message || "Server error. Please try again."
      })
    };
  }
};
