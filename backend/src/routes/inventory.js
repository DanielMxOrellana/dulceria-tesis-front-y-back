const express = require("express");
const { withConnection, withTransaction, query } = require("../db");

const router = express.Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const schema = process.env.PGSCHEMA || "public";
const VALID_MOVEMENT_TYPES = new Set(["ingreso", "salida", "ajuste"]);
const VALID_MOVEMENT_STATUSES = new Set(["pending", "approved", "rejected"]);

// Middleware para validar contraseña de admin
const validateAdmin = (req, res, next) => {
  const password = req.headers["x-admin-password"] || req.body.adminPassword;
  const role = String(req.headers["x-user-role"] || req.body.actorRole || req.body.role || "").trim().toLowerCase();
  if (password !== ADMIN_PASSWORD && role !== "admin") {
    return res.status(401).json({ ok: false, error: "Acceso denegado: contraseña de admin incorrecta" });
  }
  next();
};

function normalizeActor(body = {}) {
  const rawRole = String(body.actorRole || body.role || "admin").trim().toLowerCase();
  const role = ["vendor", "vendedor", "seller"].includes(rawRole) ? "vendor" : rawRole;
  return {
    id: body.actorId || body.userId || null,
    name: String(body.actorName || body.userName || (role === "admin" ? "Administrador" : "Usuario")).trim(),
    role,
  };
}

async function ensureMovementTable(conn) {
  await query(
    conn,
    `
      CREATE TABLE IF NOT EXISTS ${schema}.inventory_movements (
        id SERIAL PRIMARY KEY,
        candy_id INTEGER NOT NULL,
        candy_name VARCHAR(255) NOT NULL,
        actor_id TEXT,
        actor_name VARCHAR(120),
        actor_role VARCHAR(20) NOT NULL DEFAULT 'admin',
        movement_type VARCHAR(20) NOT NULL,
        quantity_before INTEGER NOT NULL,
        quantity_after INTEGER NOT NULL,
        delta INTEGER NOT NULL,
        note TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'approved',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by_id TEXT,
        approved_by_name VARCHAR(120),
        rejection_note TEXT
      )
    `
  );

  await query(conn, `ALTER TABLE ${schema}.inventory_movements ALTER COLUMN actor_id TYPE TEXT USING actor_id::TEXT`);
  await query(conn, `ALTER TABLE ${schema}.inventory_movements ALTER COLUMN approved_by_id TYPE TEXT USING approved_by_id::TEXT`);
  await query(conn, `CREATE INDEX IF NOT EXISTS idx_inventory_movements_candy_id ON ${schema}.inventory_movements(candy_id)`);
  await query(conn, `CREATE INDEX IF NOT EXISTS idx_inventory_movements_status ON ${schema}.inventory_movements(status)`);
  await query(conn, `CREATE INDEX IF NOT EXISTS idx_inventory_movements_requested_at ON ${schema}.inventory_movements(requested_at)`);
}

function getRowValue(row, key) {
  return row?.[key] ?? row?.[key.toUpperCase()];
}

function getMovementType(delta) {
  if (delta > 0) return "ingreso";
  if (delta < 0) return "salida";
  return "ajuste";
}

function requireMovementNote(note) {
  const value = String(note || "").trim();
  return value.length >= 3 ? value : "";
}

async function insertMovement(conn, movement) {
  await ensureMovementTable(conn);

  const {
    candyId,
    candyName,
    actorId,
    actorName,
    actorRole,
    movementType,
    quantityBefore,
    quantityAfter,
    delta,
    note,
    status = "approved",
    approvedById = null,
    approvedByName = null,
  } = movement;

  const rows = await query(
    conn,
    `
      INSERT INTO ${schema}.inventory_movements (
        candy_id,
        candy_name,
        actor_id,
        actor_name,
        actor_role,
        movement_type,
        quantity_before,
        quantity_after,
        delta,
        note,
        status,
        approved_at,
        approved_by_id,
        approved_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === "approved" ? "CURRENT_TIMESTAMP" : "NULL"}, ?, ?)
      RETURNING id
    `,
    [
      candyId,
      candyName,
      actorId,
      actorName,
      actorRole,
      movementType,
      quantityBefore,
      quantityAfter,
      delta,
      note,
      status,
      approvedById,
      approvedByName,
    ]
  );

  return Number(getRowValue(rows[0], "id"));
}

async function applyStockChange(conn, item, nextQuantity, actor, note, approvedBy = null) {
  const candyId = Number(getRowValue(item, "candy_id"));
  const candyName = getRowValue(item, "candy_name");
  const quantityBefore = Number(getRowValue(item, "quantity") || 0);
  const quantityAfter = Number(nextQuantity);
  const delta = quantityAfter - quantityBefore;

  await query(
    conn,
    `
      UPDATE ${schema}.inventory
      SET quantity = ?,
          available = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE candy_id = ?
    `,
    [quantityAfter, quantityAfter > 0, candyId]
  );

  if (delta !== 0) {
    await insertMovement(conn, {
      candyId,
      candyName,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      movementType: getMovementType(delta),
      quantityBefore,
      quantityAfter,
      delta,
      note,
      status: "approved",
      approvedById: approvedBy?.id || actor.id,
      approvedByName: approvedBy?.name || actor.name,
    });
  }
}

// POST /api/inventory/auth - Validar contraseña de admin
router.post("/auth", (req, res) => {
  const password = req.headers["x-admin-password"] || req.body.adminPassword;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Contraseña de admin incorrecta" });
  }

  return res.json({ ok: true, message: "Autenticacion correcta" });
});

// GET /api/inventory/movements - Logs y solicitudes de inventario (ADMIN)
router.get("/movements", validateAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || "").trim().toLowerCase();
    const params = [];
    let where = "";

    if (status) {
      if (!VALID_MOVEMENT_STATUSES.has(status)) {
        return res.status(400).json({ ok: false, error: "Estado de movimiento invalido" });
      }
      where = "WHERE status = ?";
      params.push(status);
    }

    const rows = await withConnection(async (conn) => {
      await ensureMovementTable(conn);
      return query(
        conn,
        `
          SELECT
            id,
            candy_id,
            candy_name,
            actor_id,
            actor_name,
            actor_role,
            movement_type,
            quantity_before,
            quantity_after,
            delta,
            note,
            status,
            requested_at,
            approved_at,
            approved_by_id,
            approved_by_name,
            rejection_note
          FROM ${schema}.inventory_movements
          ${where}
          ORDER BY requested_at DESC, id DESC
          FETCH FIRST 300 ROWS ONLY
        `,
        params
      );
    });

    return res.json({ ok: true, movements: rows });
  } catch (err) {
    console.error("Error obteniendo movimientos de inventario:", err);
    res.status(500).json({ ok: false, error: "Error obteniendo movimientos de inventario" });
  }
});

// PUT /api/inventory/movements/:id/approve - Aprobar movimiento pendiente (ADMIN)
router.put("/movements/:id/approve", validateAdmin, async (req, res) => {
  const movementId = Number(req.params.id);
  const admin = normalizeActor({ ...req.body, actorRole: "admin" });

  if (!Number.isInteger(movementId) || movementId <= 0) {
    return res.status(400).json({ ok: false, error: "ID de movimiento invalido" });
  }

  try {
    const result = await withTransaction(async (conn) => {
      await ensureMovementTable(conn);
      const movementRows = await query(
        conn,
        `SELECT * FROM ${schema}.inventory_movements WHERE id = ? FOR UPDATE`,
        [movementId]
      );

      if (!movementRows.length) throw new Error("Movimiento no encontrado");
      const movement = movementRows[0];
      if (getRowValue(movement, "status") !== "pending") {
        throw new Error("El movimiento ya fue procesado");
      }

      const candyId = Number(getRowValue(movement, "candy_id"));
      const itemRows = await query(
        conn,
        `SELECT candy_id, candy_name, quantity FROM ${schema}.inventory WHERE candy_id = ? FOR UPDATE`,
        [candyId]
      );

      if (!itemRows.length) throw new Error("Producto no encontrado");

      const currentQuantity = Number(getRowValue(itemRows[0], "quantity") || 0);
      const requestedAfter = Number(getRowValue(movement, "quantity_after") || 0);
      const requestedBefore = Number(getRowValue(movement, "quantity_before") || 0);
      const delta = Number(getRowValue(movement, "delta") || 0);
      const nextQuantity = currentQuantity === requestedBefore ? requestedAfter : currentQuantity + delta;

      if (nextQuantity < 0) {
        throw new Error("No hay stock suficiente para aprobar este movimiento");
      }

      await query(
        conn,
        `
          UPDATE ${schema}.inventory
          SET quantity = ?,
              available = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE candy_id = ?
        `,
        [nextQuantity, nextQuantity > 0, candyId]
      );

      await query(
        conn,
        `
          UPDATE ${schema}.inventory_movements
          SET status = 'approved',
              quantity_before = ?,
              quantity_after = ?,
              approved_at = CURRENT_TIMESTAMP,
              approved_by_id = ?,
              approved_by_name = ?
          WHERE id = ?
        `,
        [currentQuantity, nextQuantity, admin.id, admin.name, movementId]
      );

      return { id: movementId, candyId, quantityBefore: currentQuantity, quantityAfter: nextQuantity };
    });

    res.json({ ok: true, movement: result });
  } catch (err) {
    const message = err.message || "Error aprobando movimiento";
    const statusCode = ["Movimiento no encontrado", "Producto no encontrado"].includes(message) ? 404 : 400;
    res.status(statusCode).json({ ok: false, error: message });
  }
});

// PUT /api/inventory/movements/:id/reject - Rechazar movimiento pendiente (ADMIN)
router.put("/movements/:id/reject", validateAdmin, async (req, res) => {
  const movementId = Number(req.params.id);
  const admin = normalizeActor({ ...req.body, actorRole: "admin" });
  const rejectionNote = String(req.body?.rejectionNote || "").trim();

  if (!Number.isInteger(movementId) || movementId <= 0) {
    return res.status(400).json({ ok: false, error: "ID de movimiento invalido" });
  }

  try {
    const rows = await withConnection(async (conn) => {
      await ensureMovementTable(conn);
      return query(
        conn,
        `
          UPDATE ${schema}.inventory_movements
          SET status = 'rejected',
              approved_at = CURRENT_TIMESTAMP,
              approved_by_id = ?,
              approved_by_name = ?,
              rejection_note = ?
          WHERE id = ? AND status = 'pending'
          RETURNING id
        `,
        [admin.id, admin.name, rejectionNote || null, movementId]
      );
    });

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Movimiento pendiente no encontrado" });
    }

    res.json({ ok: true, movement: { id: movementId, status: "rejected" } });
  } catch (err) {
    console.error("Error rechazando movimiento:", err);
    res.status(500).json({ ok: false, error: "Error rechazando movimiento" });
  }
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
    const { updates } = req.body; // Array de {id, quantity, available, note}
    const actor = normalizeActor({ ...req.body, actorRole: "admin" });
    const defaultNote = requireMovementNote(req.body?.note);

    if (!Array.isArray(updates)) {
      return res.status(400).json({ ok: false, error: "updates debe ser un array" });
    }

    const results = [];

    await withTransaction(async (conn) => {
      for (const update of updates) {
        try {
          const { id, quantity, available } = update;
          const note = requireMovementNote(update.note || defaultNote);

          if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
            results.push({ id, ok: false, error: "Cantidad invalida" });
            continue;
          }

          const rows = await query(
            conn,
            `SELECT candy_id, candy_name, quantity FROM ${schema}.inventory WHERE candy_id = ? FOR UPDATE`,
            [id]
          );

          if (!rows.length) {
            results.push({ id, ok: false, error: "Dulce no encontrado" });
            continue;
          }

          const previousQuantity = Number(getRowValue(rows[0], "quantity") || 0);
          const nextQuantity = Number(quantity);

          if (previousQuantity !== nextQuantity && !note) {
            results.push({ id, ok: false, error: "La nota es obligatoria para cambios de stock" });
            continue;
          }

          if (available !== undefined && previousQuantity === nextQuantity) {
            await query(
              conn,
              `UPDATE ${schema}.inventory SET available = ?, updated_at = CURRENT_TIMESTAMP WHERE candy_id = ?`,
              [Boolean(available), id]
            );
          } else if (previousQuantity !== nextQuantity) {
            await applyStockChange(conn, rows[0], nextQuantity, actor, note);
          }
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
    if (Number(price) <= 0) {
      return res.status(400).json({ ok: false, error: "El precio debe ser mayor a 0." });
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
    const actor = normalizeActor(req.body || {});
    const note = requireMovementNote(req.body?.note);

    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({ ok: false, error: "El precio debe ser mayor a 0." });
    }

    await withTransaction(async (conn) => {
      // Verificar que existe
      const checkRows = await query(
        conn,
        `SELECT * FROM ${schema}.inventory WHERE candy_id = ? FOR UPDATE`,
        [id]
      );

      if (checkRows.length === 0) {
        return res.status(404).json({ ok: false, error: "Dulce no encontrado" });
      }

      const currentItem = checkRows[0];
      const hasQuantity = quantity !== undefined && quantity !== null && !isNaN(parseInt(quantity, 10));
      const parsedQuantity = hasQuantity ? parseInt(quantity, 10) : null;
      const currentQuantity = Number(getRowValue(currentItem, "quantity") || 0);
      const stockWillChange = hasQuantity && parsedQuantity !== currentQuantity;

      if (hasQuantity && parsedQuantity < 0) {
        return res.status(400).json({ ok: false, error: "Cantidad invalida" });
      }

      if (stockWillChange && !note) {
        return res.status(400).json({ ok: false, error: "La nota es obligatoria para cambios de stock" });
      }

      if (stockWillChange && actor.role === "vendor") {
        await query(
          conn,
          `
            UPDATE ${schema}.inventory
            SET
              candy_name = COALESCE(?, candy_name),
              description = COALESCE(?, description),
              category = COALESCE(?, category),
              image_url = COALESCE(?, image_url),
              price = COALESCE(?, price),
              available = COALESCE(?, available),
              min_stock = COALESCE(?, min_stock),
              updated_at = CURRENT_TIMESTAMP
            WHERE candy_id = ?
          `,
          [
            candy_name || null,
            description || null,
            category || null,
            image_url || null,
            (price !== undefined && price !== null && !isNaN(parseFloat(price))) ? parseFloat(price) : null,
            (available !== undefined && available !== null) ? Boolean(available) : null,
            (min_stock !== undefined && min_stock !== null && !isNaN(parseInt(min_stock, 10))) ? parseInt(min_stock, 10) :
              (minStock !== undefined && minStock !== null && !isNaN(parseInt(minStock, 10))) ? parseInt(minStock, 10) : null,
            parseInt(id, 10),
          ]
        );

        await insertMovement(conn, {
          candyId: Number(getRowValue(currentItem, "candy_id")),
          candyName: getRowValue(currentItem, "candy_name"),
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          movementType: getMovementType(parsedQuantity - currentQuantity),
          quantityBefore: currentQuantity,
          quantityAfter: parsedQuantity,
          delta: parsedQuantity - currentQuantity,
          note,
          status: "pending",
        });

        return res.json({
          ok: true,
          pendingApproval: true,
          message: "Movimiento de inventario enviado para aprobacion del administrador",
        });
      }

      // Actualizar campos dinámicamente o todos a la vez
      const updateSQL = `
        UPDATE ${schema}.inventory 
        SET 
          candy_name = COALESCE(?, candy_name),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          image_url = COALESCE(?, image_url),
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
        (price !== undefined && price !== null && !isNaN(parseFloat(price))) ? parseFloat(price) : null,
        (available !== undefined && available !== null && !stockWillChange) ? Boolean(available) : null,
        (min_stock !== undefined && min_stock !== null && !isNaN(parseInt(min_stock, 10))) ? parseInt(min_stock, 10) :
          (minStock !== undefined && minStock !== null && !isNaN(parseInt(minStock, 10))) ? parseInt(minStock, 10) : null,
        parseInt(id, 10)
      ]);

      if (stockWillChange) {
        await applyStockChange(conn, currentItem, parsedQuantity, actor, note);
      }

      res.json({ ok: true, message: "Dulce actualizado exitosamente" });
    });
  } catch (err) {
    console.error("Error actualizando inventario:", err);
    res.status(500).json({ ok: false, error: "Error actualizando inventario" });
  }
});

// DELETE /api/inventory/:id - Desactivar dulce (soft delete, ADMIN o Vendedor)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await withConnection(async (conn) => {
      const rows = await query(
        conn,
        `SELECT candy_id, is_deleted FROM ${schema}.inventory WHERE candy_id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ ok: false, error: "Dulce no encontrado" });
      }

      if (rows[0].is_deleted) {
        return res.json({ ok: true, message: "Dulce ya estaba desactivado" });
      }

      await query(
        conn,
        `UPDATE ${schema}.inventory SET is_deleted = TRUE, available = FALSE, updated_at = CURRENT_TIMESTAMP WHERE candy_id = ?`,
        [id]
      );
      res.json({ ok: true, message: "Dulce desactivado exitosamente" });
    });
  } catch (err) {
    console.error("Error desactivando dulce:", err);
    res.status(500).json({ ok: false, error: "Error desactivando dulce" });
  }
});

module.exports = router;
