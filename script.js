let hasilText = "";
let daftarObat = [];

const displayName = {
  ranitidin: "Ranitidin",
  ondansetron: "Ondansetron",
  metoclopramide: "Metoclopramide",
  ceftriaxone: "Ceftriaxone",
  ampicillin: "Ampisilin",
  gentamicin: "Gentamisin",
  paracetamol: "Paracetamol",
  diazepam: "Diazepam",
  ketorolac: "Ketorolac"
};

// === Standar dosis Indonesia ===
// Dosis anak (mg/kgBB)
const dosisAnak = {
  ranitidin: { rumus: bb => `${(bb*2).toFixed(1)}–${(bb*4).toFixed(1)} mg/hari terbagi 2 dosis IV` },
  ondansetron: { rumus: bb => `${Math.min(bb*0.15,16).toFixed(2)} mg IV tiap 8 jam (maks 16 mg)` },
  metoclopramide: { rumus: bb => `${(bb*0.1).toFixed(2)}–${(bb*0.2).toFixed(2)} mg IV tiap 8 jam` },
  ceftriaxone: { rumus: bb => `${(bb*50).toFixed(0)}–${(bb*75).toFixed(0)} mg/hari IV/IM (maks 2 g)` },
  ampicillin: { rumus: bb => `${(bb*100).toFixed(0)}–${(bb*200).toFixed(0)} mg/hari IV/IM terbagi 4 dosis` },
  gentamicin: { rumus: bb => `${(bb*5).toFixed(1)}–${(bb*7.5).toFixed(1)} mg/hari IV/IM terbagi 3 dosis` },
  paracetamol: { rumus: bb => `${Math.min(bb*15,1000).toFixed(0)} mg IV tiap 6–8 jam (maks 60 mg/kgBB/hari)` },
  diazepam: { rumus: bb => `${Math.min(bb*0.3,10).toFixed(1)} mg IV perlahan (maks 10 mg/dosis)` },
  ketorolac: { rumus: bb => `${Math.min(bb*0.5,30).toFixed(1)} mg IV tiap 6 jam` }
};

// Dosis dewasa (standar tetap)
const dosisDewasa = {
  ranitidin: "50 mg IV tiap 6–8 jam",
  ondansetron: "4 mg IV tiap 6–8 jam",
  metoclopramide: "10 mg IV tiap 8 jam",
  ceftriaxone: "1–2 g IV/IM tiap 24 jam (maks 4 g/hari)",
  ampicillin: "1–2 g IV tiap 6 jam",
  gentamicin: "3–5 mg/kgBB/hari IV/IM terbagi tiap 8 jam",
  paracetamol: "1 g IV tiap 6–8 jam (maks 4 g/hari)",
  diazepam: "5–10 mg IV perlahan (maks 30 mg/8 jam)",
  ketorolac: "30 mg IV tiap 6 jam (maks 120 mg/hari)"
};

document.getElementById("mode").addEventListener("change", function() {
  document.getElementById("rehidrasiOption").style.display = (this.value === "rehidrasi") ? "block" : "none";
});

function dosisOtomatis(obatKey, usia, bb) {
  if (usia < 18) {
    return dosisAnak[obatKey]?.rumus(bb) || "-";
  } else {
    return dosisDewasa[obatKey] || "-";
  }
}

function tambahObat() {
  const obatKey = document.getElementById("obat").value;
  const usia = parseInt(document.getElementById("usia").value);
  const bb = parseFloat(document.getElementById("bb").value);

  if (!obatKey) return alert("Pilih obat terlebih dahulu");
  if (!usia || !bb) return alert("Isi usia dan berat badan pasien dulu");

  const dosis = dosisOtomatis(obatKey, usia, bb);
  daftarObat.push({ nama: displayName[obatKey], detail: dosis });
  renderObat();
}

function hapusObat(i) {
  daftarObat.splice(i,1);
  renderObat();
}

function renderObat() {
  let html = "<table><tr><th>Obat</th><th>Dosis</th><th>Aksi</th></tr>";
  daftarObat.forEach((o,i)=>{
    html += `<tr><td>${o.nama}</td><td>${o.detail}</td>
             <td><button class="del-btn" onclick="hapusObat(${i})">Hapus</button></td></tr>`;
  });
  html += "</table>";
  document.getElementById("listObat").innerHTML = html;
}

function hitung() {
  const nama = document.getElementById("nama").value;
  const usia = parseInt(document.getElementById("usia").value);
  const bb = parseFloat(document.getElementById("bb").value);
  const jenisCairan = document.getElementById("jenisCairan").value;
  const setInfus = parseInt(document.getElementById("setInfus").value);
  const durasi = parseInt(document.getElementById("durasi").value);
  const mode = document.getElementById("mode").value;

  if (!nama || !usia || !bb || !durasi) {
    document.getElementById("hasil").innerHTML = "<b>Harap isi semua data pasien.</b>";
    return;
  }

  let kebutuhan = 0;
  if (mode === "maintenance") {
    if (bb <= 10) kebutuhan = bb * 100;
    else if (bb <= 20) kebutuhan = 1000 + (bb-10)*50;
    else kebutuhan = 1500 + (bb-20)*20;
  } else {
    const d = document.getElementById("derajatDehidrasi").value;
    let persen = d==="ringan"?0.05: d==="sedang"?0.08:0.1;
    kebutuhan = bb * 1000 * persen;
  }

  const mlPerJam = kebutuhan / durasi;
  const tpm = (mlPerJam * setInfus) / 60;

  hasilText = `Nama: ${nama}\nUsia: ${usia} tahun\nBB: ${bb} kg\n\n` +
              `Cairan: ${jenisCairan}\nMode: ${mode}\nKebutuhan: ${kebutuhan.toFixed(0)} ml\n` +
              `Durasi: ${durasi} jam → ${mlPerJam.toFixed(1)} ml/jam\n` +
              `Infus: ${setInfus} tpm → ${tpm.toFixed(1)} tetes/menit\n\n`;

  if (daftarObat.length) {
    hasilText += "Daftar Obat:\n";
    daftarObat.forEach((o,i)=>{ hasilText += `${i+1}. ${o.nama}: ${o.detail}\n`; });
  }

  document.getElementById("hasil").innerText = hasilText;
}

function exportPDF() {
  if (!hasilText) return alert("Hitung dulu hasilnya!");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("times","normal");
  doc.text(hasilText, 10, 10);
  doc.save("hasil_kalkulator.pdf");
}

function sendWA() {
  if (!hasilText) return alert("Hitung dulu hasilnya!");
  const url = "https://wa.me/?text=" + encodeURIComponent(hasilText);
  window.open(url, "_blank");
}