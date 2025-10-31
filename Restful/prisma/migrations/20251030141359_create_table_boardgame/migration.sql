-- CreateTable
CREATE TABLE "Boardgame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "complexidade" INTEGER NOT NULL,
    "idade" INTEGER,
    "tempo" INTEGER,
    "ano" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Boardgame_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Boardgame_nome_key" ON "Boardgame"("nome");
