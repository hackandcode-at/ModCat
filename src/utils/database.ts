import sqlite3 from 'sqlite3'
import path from 'path'

// Database path
const dbPath = path.resolve(__dirname, '..', '..', 'modcat.db.sqlite');

// Create a new database instance
export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[Database Error]', err)
        process.exit(1)
    } else {
        console.log('[Database]', 'Connected to database.')
    }
})

// Close the database connection on exit
// process.on('exit', () => {
//     db.close((err) => {
//         if (err) {
//             console.error('[Database Error]', err)
//         } else {
//             console.log('[Database]', 'Disconnected from database.')
//         }
//     })
// })