const { execSync } = require("child_process");

const PORT = process.env.PORT || 4000;

function findListeningPids(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const pids = new Set();
    output.split("\n").forEach((line) => {
      const match = line.trim().match(/LISTENING\s+(\d+)\s*$/);
      if (match) pids.add(match[1]);
    });
    return Array.from(pids);
  } catch (error) {
    return [];
  }
}

const pids = findListeningPids(PORT);

if (pids.length === 0) {
  process.exit(0);
}

for (const pid of pids) {
  try {
    execSync(`taskkill /PID ${pid} /F`);
    console.log(`Puerto ${PORT} estaba ocupado por el proceso ${pid}; se cerro para poder arrancar.`);
  } catch (error) {
    console.warn(`No se pudo liberar el puerto ${PORT} (proceso ${pid}): ${error.message}`);
  }
}
