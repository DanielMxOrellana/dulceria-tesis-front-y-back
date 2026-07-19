const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { withConnection, query } = require("../db");

const router = express.Router();
const schema = process.env.PGSCHEMA || "public";

let adminClient = null;

function getAdminClient() {
  if (adminClient) return adminClient;

  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

router.post("/register", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const fullName = String(req.body?.fullName || req.body?.name || "").trim();
  const phone = String(req.body?.phone || "").trim();
  const role = String(req.body?.role || "cliente").trim();
  const email_confirm = req.body?.email_confirm === true;

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Correo invalido." });
  }

  if (password.length < 6) {
    return res.status(400).json({ ok: false, error: "La contrasena debe tener al menos 6 caracteres." });
  }

  if (!fullName) {
    return res.status(400).json({ ok: false, error: "Nombre completo es requerido." });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return res.status(503).json({
      ok: false,
      error: "Backend auth no configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en backend/.env",
    });
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm,
      user_metadata: {
        full_name: fullName,
        phone,
      },
    });

    if (error) {
      const lower = String(error.message || "").toLowerCase();
      if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
        return res.status(409).json({ ok: false, error: "Este correo ya esta registrado." });
      }

      return res.status(400).json({ ok: false, error: error.message || "No se pudo crear el usuario." });
    }

    const userId = data?.user?.id;
    if (!userId) {
      return res.status(500).json({ ok: false, error: "No se pudo recuperar el id de usuario." });
    }

    await withConnection(async (conn) => {
      await query(
        conn,
        `
          INSERT INTO ${schema}.user_profiles (id, email, full_name, phone, role, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE
          SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            updated_at = CURRENT_TIMESTAMP
        `,
        [userId, email, fullName, phone || null, role]
      );
    });

    return res.status(201).json({
      ok: true,
      needsVerification: !email_confirm,
      user: {
        id: userId,
        email,
        fullName,
        phone,
        role,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Error interno registrando usuario." });
  }
});

router.post("/reset-password", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Correo invalido." });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return res.status(503).json({ ok: false, error: "Auth no configurada." });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.PUBLIC_URL || "http://localhost:3000"}/auth?mode=reset`,
    });

    if (error) {
      return res.status(error.status || 400).json({ ok: false, error: error.message });
    }

    return res.json({ ok: true, message: "Instrucciones enviadas." });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Error enviando correo." });
  }
});

router.post("/update-password", async (req, res) => {
  const password = String(req.body?.password || "");
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (password.length < 6) {
    return res.status(400).json({ ok: false, error: "La contrasena debe tener al menos 6 caracteres." });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return res.status(503).json({ ok: false, error: "Auth no configurada." });
  }

  try {
    // Si el frontend pasa el token, podemos usar el cliente normal de Supabase para actualizar
    // Pero como estamos en el backend con admin, podemos intentar actualizarlo si tenemos el ID
    // Sin embargo, lo mas seguro es que el frontend use el token de sesion que Supabase le dio.

    // Para simplificar, haremos que el backend reciba el token y use setSession antes de update
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return res.status(401).json({ ok: false, error: "Sesion expirada o invalida." });
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });

    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    return res.json({ ok: true, message: "Contrasena actualizada correctamente." });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Error actualizando contrasena." });
  }
});

router.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Correo invalido." });
  }

  if (!password) {
    return res.status(400).json({ ok: false, error: "Contrasena es requerida." });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return res.status(503).json({ ok: false, error: "Auth no configurada." });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);
      if (error.message === 'Email not confirmed') {
        return res.status(401).json({ ok: false, error: "Debes confirmar tu correo electrónico antes de iniciar sesión." });
      }
      return res.status(401).json({ ok: false, error: "Credenciales incorrectas. Detalles de red en el servidor." });
    }

    const userId = data?.user?.id;
    let userProfile = null;

    await withConnection(async (conn) => {
      const rows = await query(
        conn,
        `SELECT id, email, full_name, phone, role, status FROM ${schema}.user_profiles WHERE id = ?`,
        [userId]
      );
      if (rows.length > 0) {
        userProfile = {
          id: rows[0].id || rows[0].ID,
          email: rows[0].email || rows[0].EMAIL,
          name: rows[0].full_name || rows[0].FULL_NAME,
          phone: rows[0].phone || rows[0].PHONE,
          role: rows[0].role || rows[0].ROLE,
          status: rows[0].status || rows[0].STATUS,
        };
      }
    });

    if (!userProfile) {
      // Si por alguna razon no hay perfil, lo creamos con lo que hay en Supabase
      userProfile = {
        id: userId,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || "Usuario",
        role: "cliente",
        status: "activo",
      };
    }

    return res.json({
      ok: true,
      user: userProfile,
      session: data.session,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Error interno en login." });
  }
});

router.get("/users", async (req, res) => {
  try {
    await withConnection(async (conn) => {
      const rows = await query(conn, `SELECT id, email, full_name as name, phone, role, status, created_at as "joinDate" FROM ${schema}.user_profiles ORDER BY created_at DESC`);
      res.json(rows);
    });
  } catch (err) {
    console.error("Error obteniendo usuarios:", err);
    res.status(500).json({ ok: false, error: "Error obteniendo usuarios" });
  }
});

router.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { status, role } = req.body;

  try {
    await withConnection(async (conn) => {
      const updates = [];
      const params = [];

      if (status) {
        updates.push("status = ?");
        params.push(status);
      }
      if (role) {
        updates.push("role = ?");
        params.push(role);
      }

      if (updates.length === 0) {
        return res.status(400).json({ ok: false, error: "No hay campos para actualizar" });
      }

      params.push(id);
      await query(
        conn,
        `UPDATE ${schema}.user_profiles SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );

      res.json({ ok: true, message: "Usuario actualizado" });
    });
  } catch (err) {
    console.error("Error actualizando usuario:", err);
    res.status(500).json({ ok: false, error: "Error actualizando usuario" });
  }
});

module.exports = router;
