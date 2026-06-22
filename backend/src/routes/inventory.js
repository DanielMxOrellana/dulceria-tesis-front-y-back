const express = require("express");
const { withConnection, query } = require("../db");

const router = express.Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const schema = process.env.PGSCHEMA || "public";

// Middleware para validar contraseña de admin
const validateAdmin = (req, res, next) => {
  const password = req.headers["x-admin-password"] || req.body.adminPassword;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Acceso denegado: contraseña de admin incorrecta" });
  }
  next();
};

// POST /api/inventory/auth - Validar contraseña de admin
router.post("/auth", (req, res) => {
  const password = req.headers["x-admin-password"] || req.body.adminPassword;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Contraseña de admin incorrecta" });
  }

  return res.json({ ok: true, message: "Autenticacion correcta" });
});

// GET /api/inventory - Obtener inventario actual (público)
router.get("/", async (req, res) => {
  try {
    await withConnection(async (conn) => {
      const rows = await query(
        conn,
        `SELECT *, vendor_id as "vendorId", min_stock as "minStock" FROM ${schema}.inventory WHERE is_deleted = FALSE OR is_deleted IS NULL ORDER BY candy_id`
      );
      res.json({ ok: true, inventory: rows });
    });
  } catch (err) {
    console.error("Error obteniendo inventario:", err);
    res.status(500).json({ ok: false, error: "Error obteniendo inventario" });
  }
});

// GET /api/inventory/:id - Obtener un dulce específico (público)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await withConnection(async (conn) => {
      const rows = await query(
        conn,
        `SELECT * FROM ${schema}.inventory WHERE candy_id = ?`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ ok: false, error: "Dulce no encontrado" });
      }
      res.json({ ok: true, item: rows[0] });
    });
  } catch (err) {
    console.error("Error obteniendo dulce:", err);
    res.status(500).json({ ok: false, error: "Error obteniendo dulce" });
  }
});

// PUT /api/inventory/bulk/update - Actualizar múltiples (ADMIN)
router.put("/bulk/update", validateAdmin, async (req, res) => {
  try {
    const { updates } = req.body; // Array de {id, quantity, available}

    if (!Array.isArray(updates)) {
      return res.status(400).json({ ok: false, error: "updates debe ser un array" });
    }

    const results = [];

    await withConnection(async (conn) => {
      for (const update of updates) {
        try {
          const { id, quantity, available } = update;

          if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
            results.push({ id, ok: false, error: "Cantidad invalida" });
            continue;
          }

          const updateSQL = available !== undefined
            ? `UPDATE ${schema}.inventory SET quantity = ?, available = ?, updated_at = CURRENT_TIMESTAMP WHERE candy_id = ?`
            : `UPDATE ${schema}.inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE candy_id = ?`;

          const params = available !== undefined
            ? [Number(quantity), Boolean(available), id]
            : [Number(quantity), id];

          await query(conn, updateSQL, params);
          results.push({ id, ok: true });
        } catch (err) {
          results.push({ id: update.id, ok: false, error: err.message });
        }
      }
    });

    res.json({ ok: true, results });
  } catch (err) {
    console.error("Error actualizando inventario en lote:", err);
    res.status(500).json({ ok: false, error: "Error actualizando inventario en lote" });
  }
});

// POST /api/inventory - Registrar nuevo dulce (ADMIN o Vendedor)
router.post("/", async (req, res) => {
  try {
    const { candy_id, candy_name, description, category, image_url, quantity, price, available, vendor_id, vendorId, min_stock, minStock } = req.body;

    if (!candy_id || !candy_name || price === undefined) {
      return res.status(400).json({ ok: false, error: "candy_id, candy_name y price son requeridos" });
    }

    await withConnection(async (conn) => {
      const insertSQL = `
        INSERT INTO ${schema}.inventory 
        (candy_id, candy_name, description, category, image_url, quantity, price, available, vendor_id, min_stock) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await query(conn, insertSQL, [
        candy_id,
        candy_name,
        description || null,
        category || null,
        image_url || null,
        Number(quantity || 0),
        Number(price),
        available !== undefined ? Boolean(available) : true,
        vendor_id || vendorId || null,
        Number(min_stock || minStock || 0)
      ]);

      res.status(201).json({ ok: true, message: "Dulce creado exitosamente" });
    });
  } catch (err) {
    console.error("Error creando dulce:", err);
    res.status(500).json({ ok: false, error: err.message || "Error creando dulce" });
  }
});

// PUT /api/inventory/:id - Actualizar dulce completo (ADMIN o Vendedor)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { candy_name, description, category, image_url, quantity, price, available, min_stock, minStock } = req.body;

    await withConnection(async (conn) => {
      // Verificar que existe
      const checkRows = await query(
        conn,
        `SELECT * FROM ${schema}.inventory WHERE candy_id = ?`,
        [id]
      );

      if (checkRows.length === 0) {
        return res.status(404).json({ ok: false, error: "Dulce no encontrado" });
      }

      // Actualizar campos dinámicamente o todos a la vez
      const updateSQL = `
        UPDATE ${schema}.inventory 
        SET 
          candy_name = COALESCE(?, candy_name),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          image_url = COALESCE(?, image_url),
          quantity = COALESCE(?, quantity),
          price = COALESCE(?, price),
          available = COALESCE(?, available),
          min_stock = COALESCE(?, min_stock),
          updated_at = CURRENT_TIMESTAMP 
        WHERE candy_id = ?
      `;

      await query(conn, updateSQL, [
        candy_name || null,
        description || null,
        category || null,
        image_url || null,
        (quantity !== undefined && quantity !== null && !isNaN(parseInt(quantity, 10))) ? parseInt(quantity, 10) : null,
        (price !== undefined && price !== null && !isNaN(parseFloat(price))) ? parseFloat(price) : null,
        (available !== undefined && available !== null) ? Boolean(available) : null,
        (min_stock !== undefined && min_stock !== null && !isNaN(parseInt(min_stock, 10))) ? parseInt(min_stock, 10) :
          (minStock !== undefined && minStock !== null && !isNaN(parseInt(minStock, 10))) ? parseInt(minStock, 10) : null,
        parseInt(id, 10)
      ]);

      res.json({ ok: true, message: "Dulce actualizado exitosamente" });
    });
  } catch (err) {
    console.error("Error actualizando inventario:", err);
    res.status(500).json({ ok: false, error: "Error actualizando inventario" });
  }
});

// DELETE /api/inventory/:id - Eliminar dulce (ADMIN o Vendedor)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await withConnection(async (conn) => {
      // Verificar si el dulce está en algún pedido
      const checkOrdersSQL = `SELECT 1 FROM ${schema}.order_items WHERE candy_id = ? FETCH FIRST 1 ROWS ONLY`;
      const orderRows = await query(conn, checkOrdersSQL, [id]);

      if (orderRows.length > 0) {
        // Soft delete
        const softDeleteSQL = `UPDATE ${schema}.inventory SET is_deleted = TRUE, available = FALSE WHERE candy_id = ?`;
        await query(conn, softDeleteSQL, [id]);
        res.json({ ok: true, message: "Dulce ocultado (soft delete) porque tiene historial de pedidos" });
      } else {
        // Hard delete
        const deleteSQL = `DELETE FROM ${schema}.inventory WHERE candy_id = ?`;
        await query(conn, deleteSQL, [id]);
        res.json({ ok: true, message: "Dulce eliminado exitosamente" });
      }
    });
  } catch (err) {
    console.error("Error eliminando dulce:", err);
    res.status(500).json({ ok: false, error: "Error eliminando dulce" });
  }
});

module.exports = router;
