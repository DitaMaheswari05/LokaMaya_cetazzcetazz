import hashlib
import numpy as np

def compute_pseudo_vector(text: str, dim: int = 1024) -> list[float]:
    """Menghasilkan vector deterministik ter-normalisasi 1024 dimensi berdasarkan hash teks."""
    seed = int(hashlib.sha256(text.encode('utf-8')).hexdigest()[:8], 16)
    rng = np.random.RandomState(seed)
    vec = rng.randn(dim).astype(np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

regulations_data = [
    {
        "title": "Radius Pelayanan dan Aksesibilitas Pejalan Kaki (Catchment Area)",
        "category": "standar_halte",
        "section": "Pasal 1 Ayat 1",
        "content": "Radius pelayanan standar halte bus rapid transit (BRT) pada kawasan perkotaan padat ditetapkan sebesar 400 meter (ekuivalen 5 menit waktu tempuh jalan kaki santai) untuk jangkauan primer, dan 800 meter (ekuivalen 10 menit waktu tempuh jalan kaki) untuk jangkauan sekunder.",
        "source": "Standar Teknis Transit TransJakarta & Permen ATR/BPN 14/2021",
        "region": "DKI Jakarta"
    },
    {
        "title": "Metode Perhitungan Aksesibilitas Jaringan Pedestrian Aktual",
        "category": "standar_halte",
        "section": "Pasal 1 Ayat 2",
        "content": "Perhitungan jangkauan aksesibilitas wajib didasarkan pada jaringan pedestrian aktual (actual pedestrian network via isochrone routing), bukan jarak lurus geometris (Euclidean buffer).",
        "source": "Pedoman Integrasi Moda Dishub DKI & ITDP",
        "region": "DKI Jakarta"
    },
    {
        "title": "Standar Fasilitas Trotoar dan Aksesibilitas Disabilitas",
        "category": "aksesibilitas_disabilitas",
        "section": "Pasal 1 Ayat 3",
        "content": "Setiap halte transit wajib memiliki konektivitas minimum berupa trotoar menerus dengan lebar efektif minimal 1.5 meter, pemandu tunanetra (guiding block), dan fasilitas penyeberangan aman (JPO atau Pelican Crossing).",
        "source": "Permen PUPR No. 14/PRT/M/2017 tentang Persyaratan Kemudahan Bangunan Gedung",
        "region": "DKI Jakarta"
    },
    {
        "title": "Kesesuaian Zonasi Tata Ruang Transit (Zona TR, K1-K4, dan C)",
        "category": "tata_ruang",
        "section": "Pasal 2 Ayat 1",
        "content": "Penempatan halte baru atau relokasi halte eksisting diutamakan pada: Zona Transportasi (TR), Zona Perkantoran, Perdagangan, dan Jasa (K1 s.d. K4), dan Zona Campuran (C).",
        "source": "Perda DKI Jakarta No. 1/2014 & RDTR 2022",
        "region": "DKI Jakarta"
    },
    {
        "title": "Ketentuan Penempatan Halte pada Zona Perumahan Kepadatan Tinggi (R)",
        "category": "tata_ruang",
        "section": "Pasal 2 Ayat 2",
        "content": "Penempatan halte pada Zona Perumahan Kepadatan Tinggi (R) bersifat Bersyarat, dengan kewajiban menyediakan lajur henti bus (bus bay) yang tidak menimbulkan tundaan lalu lintas lokal.",
        "source": "RDTR DKI Jakarta 2022 Lampiran II",
        "region": "DKI Jakarta"
    },
    {
        "title": "Larangan Fisik Halte pada Kawasan Lindung dan SUTET",
        "category": "tata_ruang",
        "section": "Pasal 2 Ayat 3",
        "content": "Dilarang menempatkan bangunan fisik halte pada kawasan lindung sempadan sungai, sempadan rel kereta api tanpa izin instansi berwenang, dan area di bawah jalur transmisi tegangan ekstra tinggi (SUTET).",
        "source": "Perda DKI Jakarta No. 1/2014 Rencana Tata Ruang Wilayah",
        "region": "DKI Jakarta"
    },
    {
        "title": "Konstruksi Halte Panggung Elevated pada Zona Kerawanan Banjir",
        "category": "kebencanaan",
        "section": "Pasal 3 Ayat 1",
        "content": "Lokasi halte yang berada pada zona kerawanan genangan banjir kategori sedang (20–50 cm) dan tinggi (>50 cm) berdasarkan peta InaRISK BPBD DKI wajib menerapkan konstruksi halte panggung (elevated platform).",
        "source": "Pedoman Mitigasi Banjir BPBD DKI Jakarta & PT TransJakarta",
        "region": "DKI Jakarta"
    },
    {
        "title": "Elevasi Lantai Peron Halte di Atas Muka Air Banjir Historis",
        "category": "kebencanaan",
        "section": "Pasal 3 Ayat 2",
        "content": "Ketinggian lantai peron halte elevated minimal 40 cm di atas muka air banjir historis tertinggi (High Water Level) kawasan setempat.",
        "source": "Standar Desain Infrastruktur Transportasi Air Pasang DKI",
        "region": "DKI Jakarta"
    },
    {
        "title": "Kelandaian Ramp Disabilitas Halte Ramah Banjir",
        "category": "aksesibilitas_disabilitas",
        "section": "Pasal 3 Ayat 3",
        "content": "Ramp akses penyandang disabilitas pada halte elevated wajib memiliki kelandaian maksimal 1:12 disertai handrail pengaman ganda.",
        "source": "Permen PUPR 14/2017 & Perda DKI 10/2011",
        "region": "DKI Jakarta"
    },
    {
        "title": "Pengakuan Ekosistem Ekonomi Mikro dan Informal di Simpul Transit",
        "category": "umkm",
        "section": "Pasal 4 Ayat 1",
        "content": "Kawasan simpul transit TransJakarta mengakui keberadaan ekosistem ekonomi mikro dan informal sebagai bagian penting dari penghidupan warga kota dan pencipta lapangan kerja.",
        "source": "Pergub DKI Jakarta tentang Pemberdayaan Usaha Mikro",
        "region": "DKI Jakarta"
    },
    {
        "title": "Preservasi Aksesibilitas Pejalan Kaki Menuju Sentra UMKM Kuliner",
        "category": "umkm",
        "section": "Pasal 4 Ayat 2",
        "content": "Penempatan halte baru sedapat mungkin mempertahankan aksesibilitas pelanggan menuju sentra UMKM kuliner lokal dalam radius 300 meter.",
        "source": "Kajian Sosio-Spasial Simpul Transit & Dinas PPKUKM DKI",
        "region": "DKI Jakarta"
    },
    {
        "title": "Larangan Penggusuran Sepihak dan Penyediaan Transit Kiosk Bays",
        "category": "umkm",
        "section": "Pasal 4 Ayat 3",
        "content": "Kawasan sekitar halte dilarang menggusur sepihak pedagang informal; sebaliknya diwajibkan menyediakan kantong transit (transit kiosk bays) yang tertata rapi tanpa mengokupasi jalur efektif pejalan kaki.",
        "source": "Perda DKI Jakarta No. 2/2002 tentang Perpasaran Swasta & Pedagang Informal",
        "region": "DKI Jakarta"
    }
]

def main():
    sql_statements = ["-- Seeding real regulations into regulations table\\n"]
    sql_statements.append("DELETE FROM regulations;\\n")
    
    for r in regulations_data:
        vec = compute_pseudo_vector(r["title"] + " " + r["content"])
        vec_str = "[" + ",".join(f"{x:.6f}" for x in vec) + "]"
        
        title = r["title"].replace("'", "''")
        category = r["category"].replace("'", "''")
        section = r["section"].replace("'", "''")
        content = r["content"].replace("'", "''")
        source = r["source"].replace("'", "''")
        region = r["region"].replace("'", "''")
        
        sql = f"""INSERT INTO regulations (title, category, section, content, source, region, embedding)
VALUES ('{title}', '{category}', '{section}', '{content}', '{source}', '{region}', '{vec_str}'::vector);
"""
        sql_statements.append(sql)

    output_path = "infrastructure/migrations/000007_seed_regulations_data.up.sql"
    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(sql_statements)
    print(f"Generated {output_path} with {len(regulations_data)} clauses successfully.")

if __name__ == "__main__":
    main()
