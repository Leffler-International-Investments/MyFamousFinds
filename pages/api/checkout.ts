  } catch (err: any) {
    const payload = {
      type: err?.type || null,
      code: err?.code || null,
      message: err?.message || String(err),
      statusCode: err?.statusCode || null,
      requestId: err?.requestId || null,
      errno: err?.errno || null,
      syscall: err?.syscall || null,
      hostname: err?.hostname || null,
    };

    console.error("Stripe checkout error:", payload, err);
    return res.status(500).json({ ok: false, error: payload.message });
  }
