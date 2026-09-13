FROM ghcr.io/project-osrm/osrm-backend:latest

# Install wget
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Setup working directory
WORKDIR /data

# Download peta Jakarta khusus dari BBBike (ukuran kecil, hemat memori saat build)
RUN wget -q https://download.bbbike.org/osm/bbbike/Jakarta/Jakarta.osm.pbf -O map.osm.pbf

# Proses peta dengan algoritma pejalan kaki (foot.lua)
# Tahap 1: Extract (mengambil jaringan jalan yang bisa dilewati pejalan kaki)
RUN osrm-extract -p /opt/foot.lua map.osm.pbf

# Tahap 2: Partition & Customize (untuk algoritma MLD - Multi-Level Dijkstra)
RUN osrm-partition map.osrm
RUN osrm-customize map.osrm

# Hapus file PBF asli untuk menghemat kapasitas disk
RUN rm map.osm.pbf

# Expose port OSRM
EXPOSE 5000

# Jalankan server OSRM dengan peta yang sudah diproses
CMD ["osrm-routed", "--algorithm", "mld", "map.osrm"]
