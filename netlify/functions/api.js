// Netlify Function — proxy entre el navegador y Google Apps Script
// Elimina CORS completamente porque corre en el servidor

exports.handler = async function(event) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  // La URL del Apps Script se guarda como variable de entorno en Netlify
  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!SCRIPT_URL) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ ok: false, msg: 'APPS_SCRIPT_URL no configurada en Netlify' })
    };
  }

  try {
    let response;

    if (event.httpMethod === 'GET') {
      // Login, getUsers, etc. — via GET
      const params = event.queryStringParameters || {};
      const qs = new URLSearchParams(params).toString();
      response = await fetch(`${SCRIPT_URL}?${qs}`);
    } else {
      // Guardar reportes, addUser, etc. — via POST
      response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: event.body
      });
    }

    const text = await response.text();
    return {
      statusCode: 200,
      headers: CORS,
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
