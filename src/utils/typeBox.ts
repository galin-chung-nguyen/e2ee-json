/* eslint @typescript-eslint/no-explicit-any: "off" */
import {
  Static,
  TypeBoxError,
  TObject,
  TProperties,
  Type,
} from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export function getTypeboxKeys<T extends TProperties>(
  schema: TObject<T>
): string[] {
  return Object.keys(schema.properties);
}

export function typeboxFieldEncryptedDataDecoder<T extends TProperties>(
  originalSchema: TObject<T>
) {
  // Mapped Types in Typebox
  const newType = Type.Mapped(Type.KeyOf(originalSchema), () => {
    return Type.String();
  });
  return newType;
}
export function parseTypeboxdata<T extends TProperties>(
  schema: TObject<T>,
  data: any,
  cleanExcessFields: boolean = true
): Static<typeof schema> {
  try {
    const parsedData = Value.Decode(schema, data);
    const cleanedData = cleanExcessFields
      ? Value.Clean(schema, parsedData)
      : parsedData;
    return Value.Cast(schema, cleanedData);
  } catch (err) {
    const R = [...Value.Errors(schema, data)];
    console.log(R);
    throw new TypeBoxError(R.map((e) => e.message).join("\n"));
  }
}
