// FILE: /lib/ups.ts
// UPS REST API helper — OAuth token management + Shipping label creation.

const UPS_BASE_URL =
  (process.env.UPS_BASE_URL || "").trim() || "https://onlinetools.ups.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get an OAuth2 access token from UPS (client-credentials grant).
 * Cached until ~60 seconds before expiry.
 */
export async function getUpsAccessToken(): Promise<string> {
  const clientId = (process.env.UPS_CLIENT_ID || "").trim();
  const clientSecret = (process.env.UPS_CLIENT_SECRET || "").trim();
  const merchantId = (process.env.UPS_ACCOUNT_NUMBER || "").trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "UPS not configured (missing UPS_CLIENT_ID or UPS_CLIENT_SECRET)."
    );
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${UPS_BASE_URL}/security/v1/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(merchantId ? { "x-merchant-id": merchantId } : {}),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UPS auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const expiresIn = Number(data.expires_in || 14400); // UPS tokens last ~4 hours

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000, // refresh 1 min early
  };

  return cachedToken.token;
}

/**
 * Convenience wrapper: fetch with UPS Bearer auth.
 */
export async function upsFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getUpsAccessToken();
  const transactionSrc =
    (process.env.UPS_TRANSACTION_SRC || "").trim() || "myfamousfinds";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    transId: `mff-${Date.now()}`,
    transactionSrc,
    ...(options.headers as Record<string, string> || {}),
  };

  return fetch(`${UPS_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

// ────────────────────────────────────────────────
// Types for createShippingLabel
// ────────────────────────────────────────────────
export interface UpsAddress {
  name: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface UpsPackage {
  weightLbs: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
}

export interface CreateLabelParams {
  seller: UpsAddress;
  buyer: UpsAddress;
  pkg: UpsPackage;
  /** UPS service code, e.g. "03" = UPS Ground */
  serviceCode?: string;
  /** Label image format: "GIF" (default) or "PDF". */
  labelFormat?: "GIF" | "PDF";
}

export interface CreateLabelResult {
  trackingNumber: string;
  labelBase64: string;
  labelFormat: string;
}

/**
 * Create a UPS shipment and retrieve a shipping label.
 * Uses the UPS Shipping v2409 (Shipment) API.
 */
export async function createShippingLabel(
  params: CreateLabelParams
): Promise<CreateLabelResult> {
  const accountNumber = (process.env.UPS_ACCOUNT_NUMBER || "").trim();

  if (!accountNumber) {
    throw new Error("UPS_ACCOUNT_NUMBER is not configured.");
  }

  const { seller, buyer, pkg, serviceCode = "03", labelFormat: reqFormat } = params;
  // Default to env-configured format, then "GIF"
  const labelFmt = reqFormat || (process.env.UPS_LABEL_FORMAT as "GIF" | "PDF") || "GIF";

  // UPS requires non-empty phone numbers — use a placeholder if missing
  const sellerPhone = seller.phone?.replace(/\D/g, "") || "0000000000";
  const buyerPhone = buyer.phone?.replace(/\D/g, "") || "0000000000";

  const shipmentBody = {
    ShipmentRequest: {
      Request: {
        SubVersion: "2409",
        RequestOption: "nonvalidate",
        TransactionReference: {
          CustomerContext: `mff-${Date.now()}`,
        },
      },
      Shipment: {
        Description: "MyFamousFinds Order",
        Shipper: {
          Name: seller.name,
          Phone: { Number: sellerPhone },
          ShipperNumber: accountNumber,
          Address: {
            AddressLine: [seller.address1, seller.address2 || ""].filter(
              Boolean
            ),
            City: seller.city,
            StateProvinceCode: seller.state,
            PostalCode: seller.zip,
            CountryCode: seller.country || "US",
          },
        },
        ShipTo: {
          Name: buyer.name,
          Phone: { Number: buyerPhone },
          Address: {
            AddressLine: [buyer.address1, buyer.address2 || ""].filter(Boolean),
            City: buyer.city,
            StateProvinceCode: buyer.state,
            PostalCode: buyer.zip,
            CountryCode: buyer.country || "US",
          },
        },
        ShipFrom: {
          Name: seller.name,
          Phone: { Number: sellerPhone },
          Address: {
            AddressLine: [seller.address1, seller.address2 || ""].filter(
              Boolean
            ),
            City: seller.city,
            StateProvinceCode: seller.state,
            PostalCode: seller.zip,
            CountryCode: seller.country || "US",
          },
        },
        PaymentInformation: {
          ShipmentCharge: [
            {
              Type: "01", // Transportation
              BillShipper: {
                AccountNumber: accountNumber,
              },
            },
          ],
        },
        Service: {
          Code: serviceCode,
          Description: "UPS Shipping",
        },
        Package: [
          {
            Packaging: {
              Code: "02", // Customer Supplied Package
              Description: "Package",
            },
            Dimensions: {
              UnitOfMeasurement: { Code: "IN", Description: "Inches" },
              Length: String(pkg.lengthIn),
              Width: String(pkg.widthIn),
              Height: String(pkg.heightIn),
            },
            PackageWeight: {
              UnitOfMeasurement: { Code: "LBS", Description: "Pounds" },
              Weight: String(pkg.weightLbs),
            },
          },
        ],
      },
      LabelSpecification: {
        LabelImageFormat: {
          Code: labelFmt,
          Description: labelFmt,
        },
        // HTTPUserAgent is required for GIF/PNG label formats
        ...(labelFmt === "GIF" ? { HTTPUserAgent: "Mozilla/5.0" } : {}),
        LabelStockSize: {
          Height: "6",
          Width: "4",
        },
      },
    },
  };

  const res = await upsFetch("/api/shipments/v2409/ship", {
    method: "POST",
    body: JSON.stringify(shipmentBody),
  });

  const json = await res.json();

  if (!res.ok) {
    const errMsg =
      json?.response?.errors?.[0]?.message ||
      json?.errors?.[0]?.message ||
      JSON.stringify(json);
    throw new Error(`UPS Shipping API error (${res.status}): ${errMsg}`);
  }

  const shipmentResult = json?.ShipmentResponse?.ShipmentResults;
  if (!shipmentResult) {
    throw new Error(
      `UPS Shipping API: unexpected response shape — ${JSON.stringify(json).slice(0, 500)}`
    );
  }

  const trackingNumber =
    shipmentResult.ShipmentIdentificationNumber ||
    shipmentResult.PackageResults?.[0]?.TrackingNumber ||
    "";

  const packageResult = Array.isArray(shipmentResult.PackageResults)
    ? shipmentResult.PackageResults[0]
    : shipmentResult.PackageResults;

  const labelImage = packageResult?.ShippingLabel?.GraphicImage || "";
  const labelFormat =
    packageResult?.ShippingLabel?.ImageFormat?.Code || "GIF";

  return {
    trackingNumber,
    labelBase64: labelImage,
    labelFormat,
  };
}
