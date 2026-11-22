-- 009_cleanup_legacy_roadmaps.sql
-- Removes legacy unpublished roadmaps (romanian, english) from user progress and favorites.

delete from roadmap_progress where lower(roadmap_code) in ('romanian', 'english');
delete from roadmap_favorites where lower(roadmap_code) in ('romanian', 'english');
