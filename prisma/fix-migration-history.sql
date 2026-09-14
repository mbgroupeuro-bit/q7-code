-- fix-migration-history.sql
-- Bereinigt die Reste des gescheiterten Migrationsversuchs
-- "20260906113300_kalender_bereich_pflicht" vollständig:
-- 1) entfernt die verwaiste Tabelle new_termine
-- 2) entfernt den/die Einträge dieser Migration aus der Prisma-internen
--    Historie-Tabelle, damit Prisma nicht mehr versucht, sie erneut
--    anzuwenden oder als "fehlend" zu melden.
--
-- Die eigentliche Tabelle "termine" (mit den 2 Testterminen) bleibt
-- unangetastet.

DROP TABLE IF EXISTS new_termine;
DELETE FROM _prisma_migrations WHERE migration_name = '20260906113300_kalender_bereich_pflicht';
