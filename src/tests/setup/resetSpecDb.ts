import prisma from '@/lib/prisma';

export async function resetDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetDatabase should only be run in test env');
  }

  await prisma.$executeRawUnsafe(`
    DO
    $func$
    BEGIN
      EXECUTE
      (SELECT 'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ')
        || ' RESTART IDENTITY CASCADE'
       FROM pg_tables
       WHERE schemaname = 'public');
    END
    $func$;
  `);
}
