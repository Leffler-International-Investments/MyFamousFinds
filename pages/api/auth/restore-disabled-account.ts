import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, cert, getApps } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string))
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {

    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    const auth = getAuth()
    const user = await auth.getUserByEmail(email)

    if (user.disabled) {

      await auth.updateUser(user.uid, {
        disabled: false
      })

      return res.status(200).json({
        restored: true,
        message: 'Account restored'
      })
    }

    return res.status(200).json({
      restored: false,
      message: 'Account already active'
    })

  } catch (error) {

    console.error(error)

    return res.status(500).json({
      error: 'Restore failed'
    })

  }
}
