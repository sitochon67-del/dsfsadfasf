declare module "bintable_api" {
  export function Lookup(
    BIN: string,
    apiKey: string,
    callBack: (data: unknown) => void
  ): void;

  export function Balance(
    apiKey: string | undefined,
    callBack: (data: unknown) => void
  ): void;
}
