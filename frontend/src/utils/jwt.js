import * as jose from "jose";

const SECRET_KEY = "test-secret-key";

export async function createToken(payload) {
  const secret = new TextEncoder().encode(SECRET_KEY);
  const alg = "HS256";

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);

  return jwt;
}

export async function verifyToken(token) {
  const secret = new TextEncoder().encode(SECRET_KEY);

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}
