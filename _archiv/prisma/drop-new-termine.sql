-- drop-new-termine.sql
-- Einmalig: entfernt die verwaiste Tabelle "new_termine", die durch die
-- fehlgeschlagene Migration liegen geblieben ist. Rührt die eigentliche
-- Tabelle "termine" NICHT an.

DROP TABLE IF EXISTS new_termine;
