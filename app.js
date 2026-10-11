import { Client } from "https://esm.sh/@gradio/client";

// URL Space Gradio kamu (ubah sesuai Space-mu)
const GRADIO_SPACE = "xBeLQ/be-ear-cls";

// Ambil elemen DOM
const fileInput = document.getElementById("file-input");
const processBtn = document.getElementById("process-btn");
const previewImg = document.getElementById("preview");
const resultPreview = document.getElementById("result-preview");
const resultCard = document.getElementById("result-card");
const uploadArea = document.getElementById("upload-area");

let selectedFile = null;
let client = null;

// === Inisialisasi Gradio Client ===
async function initGradio() {
  try {
    client = await Client.connect(GRADIO_SPACE);
    console.log("✅ Gradio client ready!");
  } catch (err) {
    console.error("❌ Gagal konek ke Gradio Space:", err);
    alert("Gagal terhubung ke API Hugging Face. Silakan refresh halaman.");
  }
}
initGradio();

// === Upload via klik ===
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  handleFile(file);
});

// === Upload via drag-and-drop ===
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});
uploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
});
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// === Preview File ===
function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar!");
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.style.display = "block";
    resultPreview.style.display = "none";
    resultCard.style.display = "none";
    processBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

// === Proses Gambar ke Gradio Space ===
processBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Silakan pilih gambar terlebih dahulu!");
    return;
  }

  processBtn.textContent = "Memproses...";
  processBtn.disabled = true;

  try {
    const result = await client.predict("/predict", { image: selectedFile });
    console.log("API Response:", result);

    if (result && Array.isArray(result.data)) {
      // tampilkan hasil segmentasi
      resultPreview.src = result.data[0];
      resultPreview.style.display = "block";

      const statsText = result.data[1];
      const matches = {
        label1: statsText.match(/Gendang Telinga: \*\*([0-9,]+) px\*\*/),
        label2: statsText.match(/Lubang Telinga: \*\*([0-9,]+) px\*\*/),
        background: statsText.match(/Background: \*\*([0-9,]+) px\*\*/),
        ratio: statsText.match(/Persentase Kerusakan: ([0-9.]+)%/),
      };

      // tampilkan statistik
      resultCard.style.display = "block";
      document.getElementById("label0").textContent = matches.background ? matches.background[1] : "0";
      document.getElementById("label1").textContent = matches.label1 ? matches.label1[1] : "0";
      document.getElementById("label2").textContent = matches.label2 ? matches.label2[1] : "0";
      document.getElementById("ratio").textContent = matches.ratio ? matches.ratio[1] : "0";
    } else {
      alert("Error: Format response tidak valid dari API");
    }
  } catch (err) {
    console.error(err);
    alert("Gagal memproses gambar. Coba lagi.");
  } finally {
    processBtn.textContent = "Proses Gambar";
    processBtn.disabled = false;
  }
});
