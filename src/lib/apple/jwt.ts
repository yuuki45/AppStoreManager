import { SignJWT, importPKCS8 } from "jose"

interface JwtParams {
  issuerId: string
  keyId: string
  privateKey: string
}

export async function generateAppleJwt({
  issuerId,
  keyId,
  privateKey,
}: JwtParams): Promise<string> {
  const key = await importPKCS8(privateKey, "ES256")

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuerId)
    .setIssuedAt()
    .setExpirationTime("20m")
    .setAudience("appstoreconnect-v1")
    .sign(key)

  return jwt
}
