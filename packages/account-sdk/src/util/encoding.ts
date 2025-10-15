import { Signature, WebAuthnP256 } from 'ox';
import { ByteArray, Hex, hexToBytes, numberToHex, stringToBytes, trim } from 'viem';

export function base64ToBase64Url(base64: string): string {
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function arrayBufferToBase64Url(buffer: ArrayBuffer | ByteArray): string {
  // First convert to regular base64
  const base64String = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  // Then convert to base64url
  return base64ToBase64Url(base64String);
}

export function convertCredentialToJSON({
  webauthn,
  signature,
  id,
}: {
  signature: Hex;
  webauthn: WebAuthnP256.SignMetadata;
  id: string;
}) {
  const signatureRaw = Signature.fromHex(signature);
  return {
    id,
    rawId: arrayBufferToBase64Url(stringToBytes(id)),
    response: {
      authenticatorData: arrayBufferToBase64Url(hexToBytes(webauthn.authenticatorData)),
      clientDataJSON: arrayBufferToBase64Url(stringToBytes(webauthn.clientDataJSON)),
      signature: arrayBufferToBase64Url(asn1EncodeSignature(signatureRaw.r, signatureRaw.s)),
    },
    type: JSON.parse(webauthn.clientDataJSON).type,
  };
}


export function asn1EncodeSignature(r: bigint, s: bigint): Uint8Array {
  // Convert to bytes with proper encoding (prevent negative integers in ASN.1)
  const encodeInteger = (value: bigint): Uint8Array => {
    let bytes = hexToBytes(trim(numberToHex(value)));
    
    // ASN.1 requires positive integers - if MSB is set, prepend 0x00
    if (bytes[0] & 0x80) {
      const newBytes = new Uint8Array(bytes.length + 1);
      newBytes[0] = 0x00;
      newBytes.set(bytes, 1);
      return newBytes;
    }
    return bytes;
  };

  const rBytes = encodeInteger(r);
  const sBytes = encodeInteger(s);

  // Validate lengths
  if (rBytes.length > 255 || sBytes.length > 255) {
    throw new Error('Integer too long for ASN.1 encoding');
  }

  // Calculate component lengths
  const rComponentLength = 2 + rBytes.length; // tag + length + data
  const sComponentLength = 2 + sBytes.length; // tag + length + data
  const totalLength = rComponentLength + sComponentLength;

  // Validate total length
  if (totalLength > 255) {
    throw new Error('ASN.1 sequence too long');
  }

  // Create result buffer
  const result = new Uint8Array(2 + totalLength); // sequence tag + length + components
  
  // Encode sequence header
  let offset = 0;
  result[offset++] = 0x30; // SEQUENCE tag
  result[offset++] = totalLength; // sequence length

  // Encode r component
  result[offset++] = 0x02; // INTEGER tag
  result[offset++] = rBytes.length; // r length
  result.set(rBytes, offset);
  offset += rBytes.length;

  // Encode s component  
  result[offset++] = 0x02; // INTEGER tag
  result[offset++] = sBytes.length; // s length
  result.set(sBytes, offset);

  return result;
}
