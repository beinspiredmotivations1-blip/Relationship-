exports.handler = async (event) => {
  const jsonHeaders = {
    "Content-Type": "application/json"
  };

  // Optional CORS support if you ever call this from another domain
  const corsHeaders = {
    ...jsonHeaders,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true })
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Method not allowed"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const firstName = String(body.firstName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!firstName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "First name is required."
        })
      };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "A valid email address is required."
        })
      };
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_LIST_ID = process.env.BREVO_LIST_ID;
    const BREVO_LIST_IDS = process.env.BREVO_LIST_IDS; // optional comma-separated alternative
    const BREVO_FIRSTNAME_ATTRIBUTE =
      process.env.BREVO_FIRSTNAME_ATTRIBUTE || "FIRSTNAME";

    if (!BREVO_API_KEY) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Missing BREVO_API_KEY environment variable."
        })
      };
    }

    // Supports either:
    // BREVO_LIST_ID=12
    // or BREVO_LIST_IDS=12,34,56
    let listIds = [];

    if (BREVO_LIST_IDS) {
      listIds = BREVO_LIST_IDS.split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isInteger(id) && id > 0);
    } else if (BREVO_LIST_ID) {
      const singleId = Number(BREVO_LIST_ID);
      if (Number.isInteger(singleId) && singleId > 0) {
        listIds = [singleId];
      }
    }

    if (!listIds.length) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          message:
            "Missing valid Brevo list configuration. Set BREVO_LIST_ID or BREVO_LIST_IDS."
        })
      };
    }

    const attributes = {
      [BREVO_FIRSTNAME_ATTRIBUTE]: firstName
    };

    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds,
        updateEnabled: true
      })
    });

    const brevoData = await brevoResponse.json().catch(() => ({}));

    if (!brevoResponse.ok) {
      return {
        statusCode: brevoResponse.status,
        headers: corsHeaders,
        body: JSON.stringify({
          message:
            brevoData.message ||
            "Failed to add contact to Brevo."
        })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: "Successfully subscribed.",
        contactId: brevoData.id || null
      })
    };
  } catch (error) {
    console.error("Subscribe function error:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Unexpected server error."
      })
    };
  }
};
