import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

await db.execute(sql`
  UPDATE inquiries i
  JOIN students s ON s.school_id = i.school_id
                 AND s.location_id = i.location_id
                 AND CONCAT_WS(' ', s.first_name, s.last_name) = i.child_name
  SET i.student_id = s.id
  WHERE i.status = 'enrolled'
    AND i.student_id IS NULL
`);

console.log("Backfill complete.");
