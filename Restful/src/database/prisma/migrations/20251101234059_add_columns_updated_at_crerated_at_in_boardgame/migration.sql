/*
  Warnings:

  - Added the required column `updatedAt` to the `Boardgame` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Boardgame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "complexidade" INTEGER NOT NULL,
    "idade" INTEGER,
    "tempo" INTEGER,
    "ano" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Boardgame_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Boardgame" ("ano", "complexidade", "descricao", "id", "idade", "nome", "tempo", "usuarioId") SELECT "ano", "complexidade", "descricao", "id", "idade", "nome", "tempo", "usuarioId" FROM "Boardgame";
DROP TABLE "Boardgame";
ALTER TABLE "new_Boardgame" RENAME TO "Boardgame";
CREATE UNIQUE INDEX "Boardgame_nome_key" ON "Boardgame"("nome");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
