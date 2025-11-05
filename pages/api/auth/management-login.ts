// FILE: /pages/api/auth/management-login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "../../utils/firebaseAdmin"; // Your admin SDK
import {
  getAuth as getClientAuth,
  signInWithEmailAndPassword,
  MultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
} from "firebase/auth";
import { firebaseApp } from "../../utils/firebaseClient"; // Your client SDK

// List of authorized management emails
const ALLOWED_MANAGEMENT_EMAILS = [
  "arich1114@aol.com",
  "leffleryd@gmail.com",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, password, code } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // 1. Check if email is on the admin list (basic check)
  if (!ALLOWED_MANAGEMENT_EMAILS.includes(email.toLowerCase())) {
    return res.status(403).json({ error: "This email is not authorized." });
  }

  try {
    const clientAuth = getClientAuth(firebaseApp);

    // 2. Sign in with password
    const userCredential = await signInWithEmailAndPassword(
      clientAuth,
      email,
      password
    );
    
    // 3. SUCCESS! User is logged in.
    // Now we must enroll them in 2FA (this only needs to be done once)
    const user = userCredential.user;
    
    // Check if they are already enrolled
    const mfaInfo = user.multiFactor?.enrolledFactors || [];
    const phoneEnrolled = mfaInfo.some(info => info.factorId === PhoneMultiFactorGenerator.FACTOR_ID);

    if (!phoneEnrolled) {
      // Not enrolled, let's enroll them.
      // Find the phone number from your list
      const phoneNumber =
        email === "arich1114@aol.com"
          ? "+14048611733"
          : "+61478965828";
          
      // This part requires frontend interaction, which we will handle 
      // in a simplified way for this stub. A full flow would send a
      // verification code *now* to enroll.
      // For this demo, we'll assume they are enrolled.
    }

    // 4. IMPORTANT: In a real 2FA flow, Firebase would throw an 'auth/multi-factor-required'
    // error here, which we would catch. We'd then send a code.
    
    // For this stub, we will just simulate a successful login
    // and let the frontend security hook take over.
    // A real implementation is much more complex.

    return res.status(200).json({ ok: true, email: user.email });

  } catch (err: any) {
    console.error(err);
    if (err.code === "auth/multi-factor-required") {
      // THIS IS THE REAL 2FA FLOW
      // We'll add this properly in the next step.
      // For now, let's just log it.
      console.log("2FA is required, but not fully implemented in this stub.");
      return res.status(401).json({ error: "2FA is required." });
    }
    return res.status(401).json({ error: "Invalid email or password." });
  }
}
