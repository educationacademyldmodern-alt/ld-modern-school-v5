-- L D MODERN EDUCATION ACADEMY - READ ONLY
-- Inspect saved marks and exam attendance; no data changes.
SELECT p.paper_id, p.revision AS paper_revision,
 COUNT(r.student_id) AS students,
 COUNT(*) FILTER (WHERE r.marks IS NOT NULL) AS marks_saved,
 COUNT(*) FILTER (WHERE r.attendance='Present') AS present,
 COUNT(*) FILTER (WHERE r.attendance='Absent') AS absent,
 COUNT(*) FILTER (WHERE r.marks IS NOT NULL AND r.attendance IS DISTINCT FROM 'Present') AS marks_attendance_conflicts,
 MAX(r.updated_at) AS last_update
FROM public.ldm_v320_papers p
LEFT JOIN public.ldm_v320_exam_rows r ON r.paper_id=p.paper_id
GROUP BY p.paper_id,p.revision
ORDER BY last_update DESC NULLS LAST;
