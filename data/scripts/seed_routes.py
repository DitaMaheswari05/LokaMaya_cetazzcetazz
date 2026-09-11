import json
import os

def main():
    json_path = 'apps/api-go/internal/repository/data/transjakarta_routes_real.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        routes_data = json.load(f)

    sql_lines = [
        "-- 000006_seed_transjakarta_routes.up.sql",
        "-- Seed 81 Koridor & Rute Resmi TransJakarta ke transjakarta_routes",
        "INSERT INTO transjakarta_routes (id, name, corridor, geom) VALUES"
    ]

    values = []
    for i, r in enumerate(routes_data):
        r_id = f"TR-REAL-{i+1:03d}"
        name = r.get('route_name', r.get('corridor_name', 'TransJakarta')).replace("'", "''")
        corridor = r.get('corridor_name', '').replace("'", "''")
        coords = r.get('coordinates', [])
        
        if len(coords) < 2:
            continue
            
        coord_strs = [f"{pt[0]} {pt[1]}" for pt in coords]
        wkt = f"MULTILINESTRING(({', '.join(coord_strs)}))"
        values.append(f"('{r_id}', '{name}', '{corridor}', ST_SetSRID(ST_GeomFromText('{wkt}'), 4326))")

    sql_content = "\n".join(sql_lines) + "\n" + ",\n".join(values) + "\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, geom = EXCLUDED.geom;\n"

    out_path = 'infrastructure/migrations/000006_seed_transjakarta_routes.up.sql'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(sql_content)

    print(f"Generated {len(values)} routes into {out_path}")

    # Also generate down migration
    down_path = 'infrastructure/migrations/000006_seed_transjakarta_routes.down.sql'
    with open(down_path, 'w', encoding='utf-8') as f:
        f.write("DELETE FROM transjakarta_routes WHERE id LIKE 'TR-REAL-%';\n")

if __name__ == '__main__':
    main()
