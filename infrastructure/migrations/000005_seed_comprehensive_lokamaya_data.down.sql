-- 000005_seed_comprehensive_lokamaya_data.down.sql
DELETE FROM survey_activities WHERE id > 10;
DELETE FROM transjakarta_stops;
DELETE FROM transjakarta_routes;
DELETE FROM community_maps;
DELETE FROM struk_go;
DELETE FROM menu_go;
DELETE FROM rdtr_zones;
DELETE FROM flood_hazard;
