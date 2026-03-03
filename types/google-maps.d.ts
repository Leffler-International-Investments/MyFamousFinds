// Minimal type declarations for Google Maps Places Autocomplete
declare namespace google.maps {
  namespace places {
    class Autocomplete {
      constructor(
        input: HTMLInputElement,
        opts?: {
          types?: string[];
          componentRestrictions?: { country: string | string[] };
          fields?: string[];
        }
      );
      addListener(event: string, handler: () => void): void;
      getPlace(): PlaceResult;
    }

    interface PlaceResult {
      address_components?: AddressComponent[];
      formatted_address?: string;
    }

    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }
  }
}
