import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from '../models/index.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

try {
    if (!email || !password) {
        throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env');
    }
    if (password.length < 8) {
        throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres');
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('ADMIN_PASSWORD no puede superar 72 bytes');
    }

    await db.sequelize.transaction(async (transaction) => {
        const admins = await db.Usuario.findAll({
            where: { rol: 'admin' },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (admins.length !== 1) {
            throw new Error('Se requiere exactamente un admin para actualizar sus credenciales');
        }

        const admin = admins[0];
        const emailEnUso = await db.Usuario.findOne({
            where: { email },
            transaction
        });
        if (emailEnUso && emailEnUso.id !== admin.id) {
            throw new Error('ADMIN_EMAIL ya esta asociado a otra cuenta');
        }

        await admin.update({
            email,
            password_hash: await bcrypt.hash(password, 12)
        }, { transaction });
    });

    console.log('Credenciales del admin actualizadas desde .env');
} catch (error) {
    console.error(`No se pudieron actualizar las credenciales: ${error.message}`);
    process.exitCode = 1;
} finally {
    await db.sequelize.close();
}
