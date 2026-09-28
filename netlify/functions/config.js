exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ googleClientId: process.env.GOOGLE_CLIENT_ID || null })
  };
};
