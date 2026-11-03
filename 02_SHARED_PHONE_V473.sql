-- Shared contact numbers on student records; never change account or admission identifiers.
BEGIN;
SET LOCAL lock_timeout='4s';
DO $$
DECLARE idx record;
BEGIN
 FOR idx IN
   SELECT i.indexrelid::regclass AS name, c.conname
   FROM pg_catalog.pg_index i
   JOIN pg_catalog.pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=i.indkey[0]
   LEFT JOIN pg_catalog.pg_constraint c ON c.conindid=i.indexrelid AND c.conrelid=i.indrelid AND c.contype='u'
   WHERE i.indrelid='public.students'::regclass AND i.indisunique AND NOT i.indisprimary
     AND i.indnkeyatts=1 AND i.indexprs IS NULL AND a.attname='phone'
 LOOP
   IF idx.conname IS NOT NULL THEN
     EXECUTE format('ALTER TABLE public.students DROP CONSTRAINT %I RESTRICT',idx.conname);
   ELSE
     EXECUTE format('DROP INDEX %s RESTRICT',idx.name);
   END IF;
 END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS ldm_students_phone_lookup473 ON public.students(phone);
COMMIT;
